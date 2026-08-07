// 紫微逐宫 AI 解读 + 全盘详批（PRD-ZIWEI-V2 P0-B）
//
// 门槛：单宫解读 = 登录后免费 3 宫/日（ziweiAiCount，VIP 不限）；全盘详批 = VIP 专属。
// 命盘一律服务端重算（不信任前端），排盘事实注入 prompt 防幻觉；
// Redis 缓存 30 天（缓存命中不扣配额）；上游失败退配额。设施口径同 /api/bazi/stream。

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth-session';
import { refundQuota, atomicCheckAndConsume, isUserVip } from '@/lib/quota';
import { checkRateLimit } from '@/lib/rate-limit';
import { redis } from '@/lib/cache/redis';
import crypto from 'crypto';
import { PRIMARY_MODEL } from '@/lib/ai/models';
import { resolveProviders, type ResolvedProvider } from '@/lib/ai/provider';
import { attachClientAbort } from '@/lib/ai/streamProxy';
import { logger } from '@/lib/logger';
import { calculateZiwei } from '@/lib/ziwei';
import {
  calcZiweiDayun, calcZiweiLiunian, calcNatalSihua, juNumberFromName,
} from '@/lib/ziwei/dayun';
import { PALACE_DOMAIN } from '@/lib/ziwei/quickRead';
import type { PalaceInfo, TianGan } from '@/lib/ziwei/types';
import { DIZHI_LIST } from '@/lib/ziwei/constants';
import { getBeijingDate } from '@/lib/timezone';

const SERVICE = 'api/ziwei/stream';

const PALACE_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'] as const;

const requestSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hour: z.number().int().min(0).max(11),
  gender: z.enum(['male', 'female']),
  /** 单宫模式：指定宫名（免费 3 宫/日）；缺省 = 全盘详批（VIP 专属） */
  palace: z.enum(PALACE_NAMES).optional(),
  forceRefresh: z.boolean().optional(),
}).strict();

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
} as const;

const PALACE_SYSTEM_PROMPT =
  '你是资深紫微斗数命理师。你必须严格基于用户提供的「排盘事实」作答，不得自行虚构星曜或宫位。' +
  '语言通俗温暖、先结论后依据，适当引用星曜与四化名词但每个名词都要给白话解释。' +
  '输出格式：以【宫名深读】开头（与指定宫位一致），正文 300-400 字，分 2-3 段，结尾给一条可执行建议。' +
  '不预测灾祸疾病死亡；化忌、煞星一律用「功课-蓄力-给建议」的框架表述。';

const FULL_SYSTEM_PROMPT =
  '你是资深紫微斗数命理师。你必须严格基于用户提供的「排盘事实」作答，不得自行虚构星曜或宫位。' +
  '请输出全盘详批，依次分为六个章节，每章以【章节名】开头：' +
  '【命格总论】【事业官禄】【财富格局】【感情姻缘】【健康提醒】【大限与流年】。' +
  '每章 200-300 字，先结论后依据，星曜四化名词配白话解释。' +
  '不预测灾祸疾病死亡；化忌、煞星一律用「功课-蓄力-给建议」的框架表述。';

function starLine(stars: Array<{ name: string; brightness?: string; sihua?: string }>): string {
  if (!stars.length) return '（无）';
  return stars.map((s) => `${s.name}${s.brightness ? `(${s.brightness})` : ''}${s.sihua ? `[${s.sihua}]` : ''}`).join('、');
}

function palaceLine(p: PalaceInfo): string {
  const flags = [p.isLife ? '命宫所在' : '', p.isBody ? '身宫所在' : ''].filter(Boolean).join('，');
  return `${p.name}宫（${p.stem}${p.branch}${flags ? `，${flags}` : ''}）：主星 ${starLine(p.majorStars)}；辅星 ${starLine([...p.auxiliaryStars, ...p.minorStars])}`;
}

/** 三方四正：本宫 + 对宫（支+6）+ 三合两宫（支±4） */
function sanfangSizheng(palaces: PalaceInfo[], target: PalaceInfo): PalaceInfo[] {
  const idx = DIZHI_LIST.indexOf(target.branch);
  const wanted = new Set([idx, (idx + 6) % 12, (idx + 4) % 12, (idx + 8) % 12].map((i) => DIZHI_LIST[i]));
  return palaces.filter((p) => wanted.has(p.branch));
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return Response.json({ error: 'LOGIN_REQUIRED', message: '登录后即可使用 AI 解读' }, { status: 401 });
  }

  const rl = await checkRateLimit('ai_ziwei_stream', session.user.id, 10, 60);
  if (!rl.allowed) {
    return Response.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: '请求参数错误' }, { status: 400 });
  }
  const parsedResult = requestSchema.safeParse(body);
  if (!parsedResult.success) {
    return Response.json({ error: '请求参数错误' }, { status: 400 });
  }
  const { birthDate, hour, gender, palace, forceRefresh } = parsedResult.data;

  // 命盘缓存键：出生信息决定命盘，模式后缀隔离
  const chartHash = crypto.createHash('sha256')
    .update(`${birthDate}|${hour}|${gender}`)
    .digest('hex')
    .slice(0, 24);
  const cacheKey = palace
    ? `v1:ziwei:stream:${chartHash}:palace:${palace}`
    : `v1:ziwei:stream:${chartHash}:full`;

  // 1. 查缓存（不扣配额）
  if (!forceRefresh) {
    try {
      const cached = await redis.get(cacheKey);
      const text = typeof cached === 'string' ? cached : (cached == null ? '' : String(cached));
      if (text && text.trim().length > 50) {
        return new Response(text, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Source': 'cache' },
        });
      }
    } catch (err) {
      console.warn('[ziwei stream] cache read error', err);
    }
  }

  // 2. 门槛（缓存未命中才计费）：单宫 3 宫/日；全盘 VIP 专属
  let quotaConsumed = false;
  if (palace) {
    const quota = await atomicCheckAndConsume(session.user.id, 'ziweiAiCount', 3);
    if (!quota.hasQuota) {
      return Response.json(
        { error: 'QUOTA_EXCEEDED', message: '今日 3 次免费宫位解读已用完，会员不限次' },
        { status: 403 },
      );
    }
    quotaConsumed = !quota.isVip;
  } else {
    const vip = await isUserVip(session.user.id);
    if (!vip) {
      return Response.json(
        { error: 'SUBSCRIPTION_REQUIRED', message: '全盘详批为会员专属，免费用户可使用逐宫解读' },
        { status: 403 },
      );
    }
  }

  const refundIfNeeded = async () => {
    if (!quotaConsumed) return;
    try { await refundQuota(session.user.id, 'ziweiAiCount'); } catch {}
  };

  // 3. 服务端重算命盘 + 大限/流年（确定性事实，防幻觉）
  let facts: string;
  let targetLabel: string;
  try {
    const chart = calculateZiwei({ birthDate, birthHour: hour, gender });
    const yearGan = chart.debug.yearGanZhi[0] as TianGan;
    const birthYear = Number(birthDate.slice(0, 4));
    const currentYear = getBeijingDate().getUTCFullYear();
    const ju = juNumberFromName(chart.wuxingJu) ?? 3;
    const dayunList = calcZiweiDayun(chart.palaces, { yearGan, gender, birthYear, juNumber: ju, currentYear });
    const currentDayun = dayunList.find((d) => d.isCurrent);
    const liunian = calcZiweiLiunian(chart.palaces, currentYear);
    const natalSihua = calcNatalSihua(chart.palaces, yearGan);

    const lines: string[] = [];
    lines.push(`性别：${gender === 'female' ? '女' : '男'}；农历：${chart.debug.lunarDate}；年干支：${chart.debug.yearGanZhi}`);
    lines.push(`五行局：${chart.wuxingJu}；命宫在${chart.mingGong}，身宫在${chart.shenGong}；命主${chart.mingzhu}，身主${chart.shenzhu}`);
    lines.push(`生年四化：${natalSihua.map((s) => `${s.star}${s.type}${s.palaceName ? `落${s.palaceName}宫` : ''}`).join('；')}`);
    if (currentDayun) {
      lines.push(`当前大限：第${currentDayun.index + 1}限 行${currentDayun.palaceName}宫（${currentDayun.ageStart}-${currentDayun.ageEnd} 虚岁，${currentDayun.yearStart}-${currentDayun.yearEnd} 年），该宫主星：${currentDayun.majorStars.join('、') || '无（借对宫）'}`);
    }
    if (liunian) {
      lines.push(`${currentYear} 年流年（${liunian.ganZhi}）：流年命宫走${liunian.palaceName}宫（主星 ${liunian.majorStars.join('、') || '无'}）；流年四化：${liunian.sihua.map((s) => `${s.star}${s.type}${s.palaceName ? `落${s.palaceName}` : ''}`).join('；')}`);
    }

    if (palace) {
      const target = chart.palaces.find((p) => p.name === palace);
      if (!target) throw new Error(`宫位不存在: ${palace}`);
      lines.push('');
      lines.push(`【本次解读目标宫位】${palaceLine(target)}`);
      lines.push(`该宫领域：${PALACE_DOMAIN[palace] ?? palace}`);
      lines.push('三方四正（与目标宫互相影响的宫位）：');
      for (const p of sanfangSizheng(chart.palaces, target)) {
        if (p.name !== target.name) lines.push(`- ${palaceLine(p)}`);
      }
      targetLabel = `${palace}深读`;
    } else {
      lines.push('');
      lines.push('十二宫全表：');
      for (const p of chart.palaces) lines.push(`- ${palaceLine(p)}`);
      targetLabel = '全盘详批';
    }
    facts = lines.join('\n');
  } catch (err) {
    await refundIfNeeded();
    logger.error(SERVICE, 'chart calc failed', err instanceof Error ? err : undefined);
    return Response.json({ error: '排盘计算失败，请稍后重试' }, { status: 400 });
  }

  // 4. 调 LLM 流式（主 provider 失败切兜底；全挂 → 退配额 + 错误帧）
  const systemPrompt = palace ? PALACE_SYSTEM_PROMPT : FULL_SYSTEM_PROMPT;
  const userPrompt = palace
    ? `排盘事实（本地确定性计算，请据实作答）：\n${facts}\n\n请仅围绕【${palace}】宫深读：这个宫位说明了什么、当前大限流年下如何演化、给一条可执行建议。`
    : `排盘事实（本地确定性计算，请据实作答）：\n${facts}\n\n请输出全盘详批。`;

  const proxy = attachClientAbort(req);
  const openUpstream = (p: ResolvedProvider) =>
    fetch(`${p.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: proxy.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p.apiKey}`,
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        max_tokens: palace ? 1500 : 5000,
        temperature: 0.3,
        stream: true,
        enable_thinking: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

  const providers = await resolveProviders();
  let upstream: Response | null = null;
  for (const p of providers) {
    try {
      const res = await openUpstream(p);
      if (res.ok && res.body) { upstream = res; break; }
      console.warn(`[ziwei stream] provider ${p.baseUrl} status ${res.status}`);
    } catch (err) {
      if (proxy.signal.aborted) break;
      console.warn('[ziwei stream] provider error', err);
    }
  }

  if (!upstream) {
    proxy.release();
    await refundIfNeeded();
    return Response.json(
      { error: 'UPSTREAM_ERROR', message: 'AI 服务暂时不可用，请稍后再试（本次不计次数）' },
      { status: 502 },
    );
  }

  const upstreamRes = upstream;
  const encoder = new TextEncoder();
  const reader = upstreamRes.body!.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const linesArr = buffer.split('\n');
          buffer = linesArr.pop() || '';
          for (const ln of linesArr) {
            const t = ln.trim();
            if (!t || !t.startsWith('data:')) continue;
            const d = t.slice(5).trim();
            if (d === '[DONE]') continue;
            try {
              const json = JSON.parse(d);
              const delta = json.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta.length > 0) {
                fullText += delta;
                send({ delta });
              }
            } catch { /* 单行 JSON 不完整则跳过 */ }
          }
        }

        if (!proxy.signal.aborted && fullText.trim().length >= 50) {
          try { await redis.set(cacheKey, fullText, { ex: 60 * 60 * 24 * 30 }); } catch (err) {
            console.warn('[ziwei stream] cache write error', err);
          }
          send({ done: true, label: targetLabel });
        } else if (!proxy.signal.aborted) {
          // 内容过短判失败：退配额，前端提示重试
          await refundIfNeeded();
          send({ error: '生成失败，请稍后再试（本次不计次数）' });
        }
      } catch (err) {
        logger.error(SERVICE, 'stream read failed', err instanceof Error ? err : undefined);
        await refundIfNeeded();
        try { send({ error: '生成中断，请稍后再试（本次不计次数）' }); } catch {}
      } finally {
        proxy.release();
        try { controller.close(); } catch {}
      }
    },
    async cancel() {
      await proxy.cancel(reader);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
