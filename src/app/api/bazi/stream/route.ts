import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession, type Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { refundQuota } from '@/lib/quota';
import { redis } from '@/lib/cache/redis';
import { getEnvVar } from '@/lib/utils/api-wrapper';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';
import { BAZI_STREAM_SYSTEM_PROMPT, buildBaziStreamPrompt } from '@/lib/ai/prompts';
import { generateFallbackBaziAnalysis } from '@/lib/ai/client';
import { formatAnalysis } from '@/lib/ai/formatAnalysis';
import { attachClientAbort } from '@/lib/ai/streamProxy';
import { logger } from '@/lib/logger';
import type { BaziAnalysis, BaziResult } from '@/lib/bazi/types';

const SERVICE = 'api/bazi/stream';

const requestSchema = z.object({
  cacheKey: z.string().min(1),
  baziResult: z.any(),
  name: z.string().optional(),
  gender: z.string().optional(),
  birthDate: z.string(),
  birthHour: z.number().int().min(-1).max(11),
  forceRefresh: z.boolean().optional(),
  dayunExtra: z.any().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  let parsed: z.infer<typeof requestSchema>;
  try {
    const body = await req.json();
    parsed = requestSchema.parse(body);
  } catch (error) {
    return Response.json({ error: '请求参数错误' }, { status: 400 });
  }

  const { cacheKey, baziResult, name, gender, birthDate, birthHour, forceRefresh, dayunExtra } = parsed;

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

  const apiKey = getEnvVar('DEEPSEEK_API_KEY');
  if (!apiKey) {
    return streamFallback({
      reason: 'no_api_key',
      baziResult,
      session,
      name,
      birthDate,
    });
  }

  // 2. 调 DeepSeek stream
  const prompt = buildBaziStreamPrompt(baziResult as BaziResult, name, gender, dayunExtra);
  const proxy = attachClientAbort(req);

  let upstream: Response;
  try {
    upstream = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: proxy.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
  } catch (err) {
    logger.error(SERVICE, 'upstream fetch failed', err instanceof Error ? err : undefined);
    proxy.release();
    return streamFallback({ reason: 'upstream_error', baziResult, session, name, birthDate });
  }

  if (!upstream.ok || !upstream.body) {
    logger.error(SERVICE, `upstream non-ok ${upstream.status}`);
    proxy.release();
    return streamFallback({ reason: `upstream_${upstream.status}`, baziResult, session, name, birthDate });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let upstreamReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      upstreamReader = upstream.body!.getReader();
      let buffer = '';
      let fullText = '';

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
                fullText += delta;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
              }
            } catch {
              // 单行 JSON 不完整或不可解析时跳过
            }
          }
        }

        // 流结束 — 内容是纯文本，长度过短认为失败走 fallback
        if (fullText.trim().length < 100) {
          await handleFallback(controller, encoder, baziResult, session, name, birthDate);
          return;
        }

        // 写 Redis 缓存（存纯文本）
        try {
          await redis.set(cacheKey, fullText);
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
  const APP_ID = process.env.FEISHU_BOT_APP_ID;
  const APP_SECRET = process.env.FEISHU_BOT_APP_SECRET;
  const OPEN_ID = process.env.FEISHU_USER_OPEN_ID;
  if (!APP_ID || !APP_SECRET || !OPEN_ID) return;

  try {
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
    });
    const tokenData = await tokenRes.json() as { tenant_access_token?: string };
    const token = tokenData.tenant_access_token;
    if (!token) return;

    const text = `⚠️ CyberFate 八字 AI 解读失败\n姓名：${info.name}\n生日：${info.birthDate}\n用户：${info.userEmail || info.userId || '游客'}\n时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
    await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        receive_id: OPEN_ID,
        msg_type: 'text',
        content: JSON.stringify({ text }),
      }),
    });
  } catch (e) {
    console.error('[bazi stream] feishu alert failed:', e);
  }
}
