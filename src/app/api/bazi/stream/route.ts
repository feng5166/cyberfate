import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession, type Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { refundQuota, checkBaziQuota } from '@/lib/quota';
import { checkRateLimit } from '@/lib/rate-limit';
import { redis } from '@/lib/cache/redis';
import { PRIMARY_MODEL } from '@/lib/ai/models';
import { resolveProviders, type ResolvedProvider } from '@/lib/ai/provider';
import { BAZI_STREAM_SYSTEM_PROMPT, buildBaziStreamPrompt } from '@/lib/ai/prompts';
import { generateFallbackBaziAnalysis } from '@/lib/ai/client';
import { formatAnalysis } from '@/lib/ai/formatAnalysis';
import { attachClientAbort } from '@/lib/ai/streamProxy';
import { logger } from '@/lib/logger';
import { runBaziToolchain, toolchainToPromptFacts, type ToolStepResult } from '@/lib/bazi/tools';
import type { BaziAnalysis, BaziChart, BaziResult, Gender } from '@/lib/bazi/types';
import { getClientIp } from '@/lib/ip';
import { getBeijingDate } from '@/lib/timezone';
import { sendFeishuText } from '@/lib/feishu';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SERVICE = 'api/bazi/stream';

const requestSchema = z.object({
  cacheKey: z.string().min(1),
  baziResult: z.any(),
  name: z.string().optional(),
  gender: z.string().optional(),
  // 八字直输模式无出生日期：birthDate/birthHour 可缺省（大运步骤将降级，不影响其余事实）
  birthDate: z.string().optional(),
  birthHour: z.number().int().min(-1).max(11).optional(),
  // 精确时分（可选）：提供后工具链的大运起运计算更准
  birthHourNum: z.number().int().min(0).max(23).optional(),
  birthMinute: z.number().int().min(0).max(59).optional(),
  knowTime: z.boolean().optional(),
  forceRefresh: z.boolean().optional(),
  dayunExtra: z.any().optional(),
});

/** 北京时间当天 YYYY-MM-DD */
function beijingToday(): string {
  return getBeijingDate().toISOString().slice(0, 10);
}

/**
 * 用客户端命盘跑本地确定性工具链，返回每步真实计算结果（格局/用神/神煞/刑冲/大运/流年…）。
 * 这些步骤既注入 prompt 让模型据实作答，也逐条推送给首屏作「推算中」动画。
 * 任意一步失败都不阻断主流程，退回空数组（仅丢失增益、不影响出报告）。
 */
function computeToolchainSteps(
  baziResult: unknown,
  birthDate: string,
  gender: Gender,
  birthHourNum?: number,
  birthMinute?: number,
): ToolStepResult[] {
  try {
    const chart = (baziResult as BaziResult | undefined)?.chart as BaziChart | undefined;
    if (!chart?.year || !chart?.month || !chart?.day) return [];
    return runBaziToolchain({
      chart,
      birth: { birthDate, gender, birthHourNum, birthMinute },
      today: beijingToday(),
    });
  } catch (err) {
    logger.error(SERVICE, 'toolchain steps failed', err instanceof Error ? err : undefined);
    return [];
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  let parsed: z.infer<typeof requestSchema>;
  try {
    const body = await req.json();
    parsed = requestSchema.parse(body);
  } catch (error) {
    return Response.json({ error: '请求参数错误' }, { status: 400 });
  }

  const { cacheKey, baziResult, name, gender, birthHour, birthHourNum, birthMinute, knowTime, forceRefresh, dayunExtra } = parsed;
  // 八字直输无出生日期：统一兜底为空串，大运步骤会优雅降级
  const birthDate = parsed.birthDate ?? '';

  // 1. 查缓存（forceRefresh 时跳过）
  if (!forceRefresh) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        // 兼容旧缓存：字符串直接返回，对象走 formatAnalysis
        const text =
          typeof cached === 'string' ? cached : formatAnalysis(cached as BaziAnalysis);
        return new Response(text, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Source': 'cache',
          },
        });
      }
    } catch (err) {
      console.warn('[bazi stream] cache read error', err);
    }
  }

  // 走到这里说明要真正生成 AI（forceRefresh 或缓存未命中）。
  // 统一在「实际生成」处计费/限流——这是唯一会调用 DeepSeek 的位置，
  // 防止「重新分析」或直接打 /api/bazi/stream（自带任意 cacheKey 制造缓存未命中）绕过配额。
  const ip = getClientIp(req);
  if (session?.user?.id) {
    const rl = await checkRateLimit('ai_bazi', session.user.id, 10, 60);
    if (!rl.allowed) {
      return Response.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }
    const quota = await checkBaziQuota(session.user.id);
    if (!quota.hasQuota) {
      return Response.json(
        { error: 'QUOTA_EXCEEDED', message: '今日免费解读次数已用完，请升级 VIP' },
        { status: 403 },
      );
    }
  } else {
    const rl = await checkRateLimit('ai_bazi_guest', ip, 1, 86400);
    if (!rl.allowed) {
      return Response.json(
        { error: 'GUEST_LIMIT_REACHED', message: '游客每日免费解读次数已用完，登录后可继续使用' },
        { status: 429 },
      );
    }
  }

  // 按后台开关解析出 [主 provider, 兜底 provider]（已过滤没配 key 的）
  const providers = await resolveProviders();
  if (!providers.length) {
    return streamFallback({
      reason: 'no_api_key',
      baziResult,
      session,
      name,
      birthDate,
    });
  }

  // 2. 跑本地确定性工具链 → 既注入 prompt 让模型据实作答（而非脑补），也推送首屏作推算动画
  const factsGender: Gender = gender === 'female' ? 'female' : 'male';
  const hasPreciseTime = knowTime !== false && typeof birthHourNum === 'number';
  const toolSteps = computeToolchainSteps(
    baziResult,
    birthDate,
    factsGender,
    hasPreciseTime ? birthHourNum : undefined,
    hasPreciseTime ? birthMinute : undefined,
  );
  const facts = toolchainToPromptFacts(toolSteps);

  // 3. 调 LLM stream —— 主 provider 失败(网络错误/非2xx)先切兜底 provider，都不行才落本地降级
  const prompt = buildBaziStreamPrompt(baziResult as BaziResult, name, gender, dayunExtra, facts);
  const proxy = attachClientAbort(req);

  const openUpstream = (p: ResolvedProvider) =>
    fetch(`${p.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: proxy.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${p.apiKey}`,
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        max_tokens: 4000,
        temperature: 0.3,
        stream: true,
        enable_thinking: false,
        messages: [
          { role: 'system', content: BAZI_STREAM_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
    });

  let upstream: Response | null = null;
  for (const p of providers) {
    if (proxy.signal.aborted) break;
    try {
      const res = await openUpstream(p);
      if (res.ok && res.body) {
        upstream = res;
        break;
      }
      logger.error(SERVICE, `upstream non-ok ${res.status} (provider=${p.id})`);
    } catch (err) {
      logger.error(SERVICE, `upstream fetch failed (provider=${p.id})`, err instanceof Error ? err : undefined);
    }
  }

  if (!upstream) {
    proxy.release();
    return streamFallback({ reason: 'upstream_error', baziResult, session, name, birthDate });
  }
  const upstreamRes = upstream; // 收窄为非空，供下方闭包引用

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let upstreamReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // 先逐条推送真实工具链步骤（首屏「推算中」动画，结果均为本地确定性计算）
      for (const step of toolSteps) {
        if (proxy.signal.aborted) break;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'step', name: step.name, label: step.label })}\n\n`),
        );
        await sleep(120);
      }

      upstreamReader = upstreamRes.body!.getReader();
      let buffer = '';
      let fullText = '';
      let outputStarted = false; // 第一个「【」出现前丢弃思考过程

      try {
        while (true) {
          const { done, value } = await upstreamReader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (payload === '[DONE]') continue;

            try {
              const obj = JSON.parse(payload);
              const delta: string =
                obj?.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                if (!outputStarted) {
                  // 检测第一个「【」章节标志符
                  const testText = fullText + delta;
                  const markerIdx = testText.indexOf('【');
                  if (markerIdx === -1) {
                    // 还没出现「【」，丢弃这段（思考过程）
                    fullText = testText; // 保留小缓冲防止跨 delta 切割
                    continue;
                  }
                  // 找到「【」，从这里开始
                  outputStarted = true;
                  const realDelta = testText.slice(markerIdx);
                  fullText = realDelta;
                  if (realDelta) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: realDelta })}\n\n`));
                  }
                } else {
                  fullText += delta;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
                }
              }
            } catch {
              // 单行 JSON 不完整或不可解析时跳过
            }
          }
        }

        // 流结束 — 未进入正文(从未出现「【」，fullText 仍是思考过程)或内容过短，都判失败走 fallback，
        // 避免把思考过程当正文推给前端并污染永久缓存
        if (!outputStarted || fullText.trim().length < 100) {
          await handleFallback(controller, encoder, baziResult, session, name, birthDate);
          return;
        }

        // 写 Redis 缓存（存纯文本，30 天 TTL：即便偶发脏内容也会自然过期，不会永久污染该命盘）
        try {
          await redis.set(cacheKey, fullText, { ex: 60 * 60 * 24 * 30 });
        } catch (err) {
          console.warn('[bazi stream] cache write error', err);
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, source: 'deepseek', aiAnalysis: fullText })}\n\n`)
        );
      } catch (err) {
        logger.error(SERVICE, 'stream read failed', err instanceof Error ? err : undefined);
        try {
          await handleFallback(controller, encoder, baziResult, session, name, birthDate);
        } catch {}
      } finally {
        controller.close();
        proxy.release();
      }
    },
    async cancel() {
      await proxy.cancel(upstreamReader);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Source': 'deepseek',
    },
  });
}

async function handleFallback(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  baziResult: unknown,
  session: Session | null,
  name: string | undefined,
  birthDate: string
) {
  const fallback = generateFallbackBaziAnalysis(baziResult as BaziResult);
  const text = formatAnalysis(fallback);

  // 退还配额（fallback 时）
  if (session?.user?.id) {
    try {
      await refundQuota(session.user.id, 'baziAiCount');
    } catch {}
  }

  // 飞书告警
  void sendFeishuAlert({
    name: name || '缘主',
    birthDate,
    userId: session?.user?.id,
    userEmail: (session?.user as { email?: string } | undefined)?.email,
  });

  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify({ fallback: true, text })}\n\n`)
  );
}

function streamFallback(opts: {
  reason: string;
  baziResult: unknown;
  session: Session | null;
  name: string | undefined;
  birthDate: string;
}): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      await handleFallback(controller, encoder, opts.baziResult, opts.session, opts.name, opts.birthDate);
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Source': 'fallback',
    },
  });
}

// ── 飞书告警（AI fallback 时通知 Frank）─────────────────
async function sendFeishuAlert(info: {
  name: string;
  birthDate: string;
  userId?: string;
  userEmail?: string;
}) {
  const text = `⚠️ CyberFate 八字 AI 解读失败\n姓名：${info.name}\n生日：${info.birthDate}\n用户：${info.userEmail || info.userId || '游客'}\n时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
  await sendFeishuText(text);
}
