import { NextRequest } from 'next/server';
import { Lunar } from 'lunar-javascript';
import { z } from 'zod';
import { getServerSession, type Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { refundQuota, atomicCheckAndConsume, isUserVip } from '@/lib/quota';
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

// 上游首字节(TTFB)超时：网关挂起时 15s 没等到响应头就换 provider，
// 不能用 AbortSignal.timeout 直传——那会在首字节之后继续计时，把健康的长流一起杀掉
const UPSTREAM_TTFB_MS = 15_000;
// 读流阶段空闲 watchdog：连上后 20s「上游一个字节都没来」视为卡死，abort 走 fallback。
// 否则用户盯着「推算中」直到 Vercel 60s 击杀函数——配额已扣、退款+飞书告警分支永远走不到。
// 续命信号是「任何字节到达」而非「非空正文 delta」：上游排队时会持续发 SSE 心跳(: ping)/空 delta/
// reasoning 帧，只认正文会把排队中的健康请求当卡死杀掉，用户白拿一份模板兜底
const UPSTREAM_IDLE_MS = 20_000;
// 首个产出帧（正文 delta 或 reasoning 帧）之前的绝对上限：这一段心跳不能无限续命，
// 否则「只发心跳的僵尸流」照样把函数拖到 Vercel 60s 击杀。
// 15s TTFB + 30s 首帧 = 45s，仍给退配额 + 飞书告警留出十几秒余量
const UPSTREAM_FIRST_TOKEN_MS = 30_000;
// 中途断流时，已流出正文达到此长度就保留原文（只追加中断说明），不再整体替换为模板兜底
const PARTIAL_KEEP_MIN_CHARS = 200;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 议题式 AI（PRD-BAZI-V2 P0-A）：六大人生议题，单议题 300-400 字按需生成 */
const TOPICS = {
  career: { label: '事业攻守', focus: '事业方向与行业属性（结合用神五行）、当前大运下宜攻宜守、未来两三年的职场节奏' },
  wealth: { label: '财从何来', focus: '正财偏财结构、适合的求财方式、需要留意的破财风险点、近年财运节奏' },
  love: { label: '正缘何时', focus: '配偶星与婚姻宫状态、正缘的大致特征、感情节奏与相对有利的时段' },
  health: { label: '身体软肋', focus: '五行失衡对应需要养护的身体部位与作息建议（不做医疗诊断，只谈养生方向）' },
  personality: { label: '性格底色', focus: '性格优势与短板、人际风格、适合的成长方式' },
  dayun: { label: '十年大势', focus: '当前大运的主题与吉凶取向、与下一步大运的衔接转折、十年维度的节奏建议' },
} as const;
type TopicKey = keyof typeof TOPICS;

const TOPIC_SYSTEM_PROMPT =
  '你是资深八字命理师。你必须基于用户提供的「命理推算事实」作答，不得自行编造排盘结果。' +
  '语言通俗温暖、先结论后依据。输出格式：以【议题名】开头（与用户指定议题一致），正文 300-400 字，分 2-3 段，结尾给一条可执行建议。' +
  '不预测灾祸疾病，低谷话题一律用「提醒-蓄力-给建议」的框架表述。';

const requestSchema = z.object({
  cacheKey: z.string().min(1),
  baziResult: z.any(),
  name: z.string().optional(),
  gender: z.string().optional(),
  // 八字直输模式无出生日期：birthDate/birthHour 可缺省（大运步骤将降级，不影响其余事实）
  // 注意 birthDate 是「用户填的那一串」：isLunar=true 时它是农历日，不能直接拿去算大运，
  // 必须先经 resolveSolarBirthDate 折算，见该函数注释。
  birthDate: z.string().optional(),
  // /api/bazi 随排盘响应下发的公历锚点（农历输入时 ≠ birthDate）。新客户端原样回传，
  // 老客户端不传 → 走 isLunar 兜底或按阳历处理，行为与本次改动前一致。
  // 故意不在 schema 里用 .regex() 严校验、也允许 null：它只是一个「让大运更准」的可选提示，
  // 客户端把它传成空串/null（如八字直输模式、存量记录）不该让整份解读 400 掉。
  // 形状校验挪到 resolveSolarBirthDate 里做，不合格就静默降级到 isLunar 兜底。
  solarBirthDate: z.string().nullish(),
  // birthDate 是否按农历填写。仅在 solarBirthDate 缺失时用于服务端自行折算（存量记录/老客户端路径）。
  isLunar: z.boolean().optional(),
  birthHour: z.number().int().min(-1).max(11).optional(),
  // 精确时分（可选）：提供后工具链的大运起运计算更准
  birthHourNum: z.number().int().min(0).max(23).optional(),
  birthMinute: z.number().int().min(0).max(59).optional(),
  knowTime: z.boolean().optional(),
  forceRefresh: z.boolean().optional(),
  dayunExtra: z.any().optional(),
  /** 议题式生成：带 topic → 单议题（免费 3 议题/日）；不带 → 全盘详批（VIP 专属） */
  topic: z.enum(['career', 'wealth', 'love', 'health', 'personality', 'dayun']).optional(),
});

/** 北京时间当天 YYYY-MM-DD */
function beijingToday(): string {
  return getBeijingDate().toISOString().slice(0, 10);
}

/**
 * 农历 YYYY-MM-DD → 公历 YYYY-MM-DD。
 *
 * 与 calculateBazi 内部的折算、以及 /api/bazi 下发 solarBirthDate 时用的折算逐字同构
 *（都是 Lunar.fromYmd(y,m,d).getSolar()）。任何一处改口径都必须同步其余各处，
 * 否则「四柱与大运同源」的保证立刻失效。
 * 闰月（负月号）表达不了，与 calculateBazi 的限制一致。
 */
function lunarToSolarYmd(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const solar: any = (Lunar as any).fromYmd(y, m, d).getSolar();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${solar.getYear()}-${pad(solar.getMonth())}-${pad(solar.getDay())}`;
}

/**
 * 解析本次解读的「公历锚点」——工具链里 getCurrentDayun / getDayunTimeline 只认公历串
 *（内部一律 Solar.fromYmd），拿农历原串喂进去等于用另一个日期排大运。
 *
 * 为什么非修不可：/api/bazi 已把农历折算成公历再排四柱，四柱因此是对的；
 * 而本路由的工具链事实（大运/起运/流年）若仍按农历原串算，喂给模型的就是另一副盘——
 * 屏幕上的大运表与 AI 正文互相矛盾，对农历用户 100% 命中。
 *
 * 取值优先级（两条来源，都缺就退回原串）：
 *  ① solarBirthDate：/api/bazi 本次排盘算出并随响应下发、由客户端原样回传。
 *     优先它是因为它与同一请求里送来的 baziResult（四柱）出自同一次排盘，天然同源。
 *  ② isLunar=true：客户端只带得出农历标记时（存量历史记录没存 solarBirthDate，
 *     补齐链路也只透传 isLunar），在这里按与 /api/bazi 相同的口径自行折算。
 *  ③ 两者都没有：原样返回 birthDate。阳历用户走的就是这一支（或 ① 的恒等映射），
 *     结果与本次改动前逐字相同；老客户端同理，不会崩、也不会把阳历日误当农历折算。
 */
function resolveSolarBirthDate(
  birthDate: string,
  solarBirthDate: string | null | undefined,
  isLunar: boolean | undefined,
): string {
  if (solarBirthDate) {
    if (DATE_RE.test(solarBirthDate)) return solarBirthDate;
    // 形状不对说明客户端契约破了：记一条 warn 便于定位，然后按「没传」继续走下面的兜底
    logger.warn(SERVICE, `ignored malformed solarBirthDate (${solarBirthDate})`);
  }
  if (isLunar === true && DATE_RE.test(birthDate)) {
    try {
      return lunarToSolarYmd(birthDate);
    } catch (err) {
      // 农历日不存在（如某年六月只有 29 天却填了 30）等异常：退回原串。
      // 这与改动前的行为完全一致（大运仍不准），但绝不因为一次折算失败就让整份解读失败。
      logger.error(SERVICE, `lunar→solar failed (${birthDate})`, err instanceof Error ? err : undefined);
      return birthDate;
    }
  }
  return birthDate;
}

/**
 * 用客户端命盘跑本地确定性工具链，返回每步真实计算结果（格局/用神/神煞/刑冲/大运/流年…）。
 * 这些步骤既注入 prompt 让模型据实作答，也逐条推送给首屏作「推算中」动画。
 * 任意一步失败都不阻断主流程，退回空数组（仅丢失增益、不影响出报告）。
 *
 * solarBirthDate 必须是**公历**日（见 resolveSolarBirthDate）：八字直输模式无出生日期时为空串，
 * 大运步骤会在 runBaziToolchain 内单步降级，其余事实不受影响。
 */
function computeToolchainSteps(
  baziResult: unknown,
  solarBirthDate: string,
  gender: Gender,
  birthHourNum?: number,
  birthMinute?: number,
): ToolStepResult[] {
  try {
    const chart = (baziResult as BaziResult | undefined)?.chart as BaziChart | undefined;
    if (!chart?.year || !chart?.month || !chart?.day) return [];
    return runBaziToolchain({
      chart,
      birth: { birthDate: solarBirthDate, gender, birthHourNum, birthMinute },
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

  const { cacheKey, baziResult, name, gender, birthHour, birthHourNum, birthMinute, knowTime, forceRefresh, dayunExtra, topic } = parsed;
  // 八字直输无出生日期：统一兜底为空串，大运步骤会优雅降级
  // birthDate 保持「用户填的那一串」，只用于飞书告警文案（运维要看到用户实际输入的是什么）；
  // 命理计算一律改用下面第 2 步解析出的公历锚点。
  const birthDate = parsed.birthDate ?? '';
  // 议题模式独立缓存键，与全盘详批互不污染
  const effectiveCacheKey = topic ? `${cacheKey}:topic:${topic}` : cacheKey;

  // 1. 查缓存（forceRefresh 时跳过）
  if (!forceRefresh) {
    try {
      const cached = await redis.get(effectiveCacheKey);
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
  // 门槛（PRD-BAZI-V2 §4）：议题式 = 免费 3 议题/日（游客 1/日）；全盘详批 = VIP 专属。
  const ip = getClientIp(req);
  let quotaConsumed = false; // fallback 时仅退还真正扣过的配额
  if (session?.user?.id) {
    const rl = await checkRateLimit('ai_bazi', session.user.id, 10, 60);
    if (!rl.allowed) {
      return Response.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }
    if (topic) {
      const quota = await atomicCheckAndConsume(session.user.id, 'baziAiCount', 3);
      if (!quota.hasQuota) {
        return Response.json(
          { error: 'QUOTA_EXCEEDED', message: '今日 3 次免费议题解读已用完，会员不限次' },
          { status: 403 },
        );
      }
      quotaConsumed = !quota.isVip;
    } else {
      const vip = await isUserVip(session.user.id);
      if (!vip) {
        return Response.json(
          { error: 'SUBSCRIPTION_REQUIRED', message: '全盘详批为会员专属，免费用户可使用六大议题解读' },
          { status: 403 },
        );
      }
    }
  } else {
    if (!topic) {
      return Response.json(
        { error: 'SUBSCRIPTION_REQUIRED', message: '全盘详批为会员专属，登录后可免费使用议题解读' },
        { status: 403 },
      );
    }
    const rl = await checkRateLimit('ai_bazi_guest', ip, 1, 86400);
    if (!rl.allowed) {
      return Response.json(
        { error: 'GUEST_LIMIT_REACHED', message: '游客每日免费议题次数已用完，登录后每天可用 3 次' },
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
      refund: quotaConsumed,
    });
  }

  // 2. 跑本地确定性工具链 → 既注入 prompt 让模型据实作答（而非脑补），也推送首屏作推算动画
  const factsGender: Gender = gender === 'female' ? 'female' : 'male';
  const hasPreciseTime = knowTime !== false && typeof birthHourNum === 'number';
  // 公历锚点在这里才解析：缓存命中/配额拒绝的请求根本走不到工具链，不必白做一次农历折算。
  const solarBirthDate = resolveSolarBirthDate(birthDate, parsed.solarBirthDate, parsed.isLunar);
  const toolSteps = computeToolchainSteps(
    baziResult,
    solarBirthDate,
    factsGender,
    hasPreciseTime ? birthHourNum : undefined,
    hasPreciseTime ? birthMinute : undefined,
  );
  const facts = toolchainToPromptFacts(toolSteps);

  // 3. 调 LLM stream —— 主 provider 失败(网络错误/非2xx)先切兜底 provider，都不行才落本地降级
  const proxy = attachClientAbort(req);

  let systemPrompt: string;
  let userPrompt: string;
  if (topic) {
    const t = TOPICS[topic as TopicKey];
    const chart = (baziResult as BaziResult | undefined)?.chart as BaziChart | undefined;
    const pillarsText = chart
      ? [chart.year, chart.month, chart.day, chart.hour]
          .filter((p): p is NonNullable<typeof p> => Boolean(p))
          .map((p) => `${p.gan}${p.zhi}`)
          .join(' ')
      : '';
    systemPrompt = TOPIC_SYSTEM_PROMPT;
    userPrompt =
      `命主：${name || '缘主'}，性别：${gender === 'female' ? '女' : '男'}，四柱：${pillarsText}\n\n` +
      `命理推算事实（本地确定性计算，请据实作答）：\n${facts || '（无）'}\n\n` +
      `请仅围绕议题【${t.label}】作答：${t.focus}`;
  } else {
    systemPrompt = BAZI_STREAM_SYSTEM_PROMPT;
    userPrompt = buildBaziStreamPrompt(baziResult as BaziResult, name, gender, dayunExtra, facts);
  }

  // 每个 provider 一个独立 AbortController：既转发客户端断连(proxy.signal)，
  // 又能被 TTFB 超时 / 空闲 watchdog 单独 abort（proxy.signal 是整个请求共用的，不能拿它当计时器）
  const openUpstream = async (p: ResolvedProvider) => {
    const ac = new AbortController();
    const onClientAbort = () => ac.abort();
    if (proxy.signal.aborted) ac.abort();
    else proxy.signal.addEventListener('abort', onClientAbort, { once: true });

    // 拿到响应头即 clearTimeout：读流阶段交给空闲 watchdog 看护，健康长流不会被误杀
    const ttfbTimer = setTimeout(() => ac.abort(), UPSTREAM_TTFB_MS);
    const detach = () => {
      clearTimeout(ttfbTimer);
      proxy.signal.removeEventListener('abort', onClientAbort);
    };

    try {
      const res = await fetch(`${p.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: ac.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${p.apiKey}`,
        },
        body: JSON.stringify({
          model: PRIMARY_MODEL,
          max_tokens: topic ? 1500 : 6000,
          temperature: 0.3,
          stream: true,
          enable_thinking: false,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
      clearTimeout(ttfbTimer);
      return { res, abort: () => ac.abort(), detach };
    } catch (err) {
      detach();
      throw err;
    }
  };

  let upstream: Response | null = null;
  let abortUpstream: (() => void) | null = null; // 空闲 watchdog 用：主动掐断当前上游
  let detachUpstream: (() => void) | null = null;
  for (const p of providers) {
    if (proxy.signal.aborted) break;
    try {
      const opened = await openUpstream(p);
      if (opened.res.ok && opened.res.body) {
        upstream = opened.res;
        abortUpstream = opened.abort;
        detachUpstream = opened.detach; // 读完/出错后再移除客户端断连监听（读流期间必须留着）
        break;
      }
      // 非 2xx：释放连接与监听后再试下一个 provider（TTFB 超时会以 AbortError 走下面的 catch）
      opened.abort();
      opened.detach();
      logger.error(SERVICE, `upstream non-ok ${opened.res.status} (provider=${p.id})`);
    } catch (err) {
      logger.error(SERVICE, `upstream fetch failed (provider=${p.id})`, err instanceof Error ? err : undefined);
    }
  }

  if (!upstream) {
    proxy.release();
    return streamFallback({ reason: 'upstream_error', baziResult, session, name, birthDate, refund: quotaConsumed });
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

      // 空闲 watchdog：超时则 abort 上游 → read() 抛 AbortError → 下面的 catch 收网，不新造分支。
      // 两段窗口：
      //   首帧前 —— 用「读流起点 + 首帧上限」的绝对剩余时间，心跳帧不能把它续下去（防僵尸流）；
      //   首帧后 —— 转为 20s 滚动空闲窗口，任何字节（含心跳）都续命，健康长流不会被误杀
      const readStartedAt = Date.now();
      let producing = false; // 上游是否已开始产出（正文 delta 或 reasoning 帧）
      let idleTimer: ReturnType<typeof setTimeout> | null = null;
      const armIdleWatchdog = () => {
        if (idleTimer) clearTimeout(idleTimer);
        const waitingFirstToken = !producing;
        const ms = waitingFirstToken
          ? Math.max(0, readStartedAt + UPSTREAM_FIRST_TOKEN_MS - Date.now())
          : UPSTREAM_IDLE_MS;
        idleTimer = setTimeout(() => {
          logger.error(
            SERVICE,
            waitingFirstToken
              ? `upstream produced no token within ${UPSTREAM_FIRST_TOKEN_MS}ms, aborting`
              : `upstream idle > ${UPSTREAM_IDLE_MS}ms, aborting`,
          );
          abortUpstream?.();
        }, ms);
      };
      armIdleWatchdog();

      try {
        while (true) {
          const { done, value } = await upstreamReader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // 有字节到达就续命：心跳/空 delta/reasoning 帧都证明上游连接活着（首帧前仍受绝对上限约束）
          armIdleWatchdog();

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
              const deltaObj = obj?.choices?.[0]?.delta;
              const delta: string = deltaObj?.content ?? '';
              // 正文与思考(reasoning_content)都算「上游已开始产出」：思考阶段可能长于首帧上限，
              // 一旦开始产出就切到滚动空闲窗口，不再受首帧绝对上限约束
              if (!producing && (delta || deltaObj?.reasoning_content)) {
                producing = true;
                armIdleWatchdog();
              }
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
          await handleFallback(controller, encoder, baziResult, session, name, birthDate, quotaConsumed);
          return;
        }

        // 写 Redis 缓存（存纯文本，30 天 TTL：即便偶发脏内容也会自然过期，不会永久污染该命盘）
        try {
          await redis.set(effectiveCacheKey, fullText, { ex: 60 * 60 * 24 * 30 });
        } catch (err) {
          console.warn('[bazi stream] cache write error', err);
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, source: 'deepseek', aiAnalysis: fullText })}\n\n`)
        );
      } catch (err) {
        logger.error(SERVICE, 'stream read failed', err instanceof Error ? err : undefined);
        try {
          // 已流出足量正文时不走模板兜底：前端收到 {fallback:true,text} 会用模板整体覆盖，
          // 把用户已经读到的真解读换成通用套话，比「半截真解读」更糟。
          // 此时保留原文 + 追加中断说明，用 done 帧收尾（前端按正常解读渲染/存档）；
          // 但不写 Redis 缓存——30 天 TTL 会把半截解读固化给这个命盘
          if (outputStarted && fullText.trim().length >= PARTIAL_KEEP_MIN_CHARS) {
            await handlePartialInterrupt(controller, encoder, fullText, session, name, birthDate, quotaConsumed);
          } else {
            await handleFallback(controller, encoder, baziResult, session, name, birthDate, quotaConsumed);
          }
        } catch {}
      } finally {
        if (idleTimer) clearTimeout(idleTimer);
        detachUpstream?.();
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
  birthDate: string,
  refund: boolean,
) {
  const fallback = generateFallbackBaziAnalysis(baziResult as BaziResult);
  const text = formatAnalysis(fallback);

  // 退还配额（仅当本次真正扣过；VIP 全盘/缓存命中不扣也不退）
  if (refund && session?.user?.id) {
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

/**
 * 中途断流但已流出足量正文：保留已生成内容，只追加一句中断说明，并以 done 帧收尾。
 * 前端 done 分支走正常解读渲染/存档（fallback 帧才会整体替换文本），用户不会丢掉已读到的真解读；
 * 议题面板只累加 delta、不认 done，追加的说明同样会落到面板文本里。
 * 配额照旧退还（解读不完整不该计费，退还条件与 handleFallback 一致：仅当本次真扣过），
 * 飞书仍告警——中断对运维依然是需要感知的失败。
 */
async function handlePartialInterrupt(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  partialText: string,
  session: Session | null,
  name: string | undefined,
  birthDate: string,
  refund: boolean,
) {
  const notice = '\n\n（本次解读在生成中途中断，以上为已完成部分。可点击「重新分析」获取完整解读。）';
  const text = partialText + notice;

  // 先退配额再推帧：客户端已断开时 enqueue 会抛错，放在后面会把退款一起吞掉（与 handleFallback 同序）
  if (refund && session?.user?.id) {
    try {
      await refundQuota(session.user.id, 'baziAiCount');
    } catch {}
  }

  void sendFeishuAlert({
    name: name || '缘主',
    birthDate,
    userId: session?.user?.id,
    userEmail: (session?.user as { email?: string } | undefined)?.email,
    reason: '流式解读中途中断（已保留部分正文，未写缓存）',
  });

  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: notice })}\n\n`));
  controller.enqueue(
    // partial:true —— 服务端刻意不写 Redis（半截解读不该被 30 天 TTL 固化），
    // 客户端必须据此同样不落盘、不 PATCH 档案，并保留「重新生成」入口。
    // 服务端不缓存与客户端不存档要成对，否则本地又把半截内容固化了一遍。
    encoder.encode(`data: ${JSON.stringify({ done: true, source: 'deepseek', partial: true, aiAnalysis: text })}\n\n`)
  );
}

function streamFallback(opts: {
  reason: string;
  baziResult: unknown;
  session: Session | null;
  name: string | undefined;
  birthDate: string;
  refund: boolean;
}): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      await handleFallback(controller, encoder, opts.baziResult, opts.session, opts.name, opts.birthDate, opts.refund);
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
  reason?: string; // 区分「整单降级」与「中途中断保留部分正文」，便于运维判断严重度
}) {
  const text = `⚠️ CyberFate 八字 AI 解读失败\n姓名：${info.name}\n生日：${info.birthDate}\n用户：${info.userEmail || info.userId || '游客'}${info.reason ? `\n原因：${info.reason}` : ''}\n时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
  await sendFeishuText(text);
}
