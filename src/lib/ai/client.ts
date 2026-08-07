import {
  buildDailyPrompt,
  buildLiuYaoPrompt,
  buildMeihuaDecisionPrompt,
  buildTarotReadingPrompt,
  buildTarotReadingSystemPrompt,
  DAILY_SYSTEM_PROMPT,
  LIUYAO_SYSTEM_PROMPT,
  MEIHUA_DECISION_SYSTEM_PROMPT,
  type LiuYaoPromptInput,
  type MeihuaDecisionPromptInput,
  type TarotReadingPromptInput,
  type TarotSpread,
} from './prompts';
import { after } from 'next/server';
import type { BaziResult, BaziAnalysis } from '../bazi/types';
import { callExternalAPI } from '../utils/api-wrapper';
import { redis } from '../cache/redis';
import { PRIMARY_MODEL } from './models';
import { withCircuitBreaker } from './circuitBreaker';
import { resolveProviders, hasAnyProviderKey } from './provider';
import { observed } from './observe';

const TIMEOUT_CONFIG: Record<string, number> = {
  bazi: 55000,
  daily: 55000,
  marriage: 30000,
  tarot: 110000,
  huangli: 10000,
  huangli_ask: 10000,
  liuyao: 55000,
  meihua: 55000,
  default: 15000,
};

// 各 feature 的函数级总预算（ms）= vercel.json 对应路由 maxDuration − 5s 安全余量。
// deadline 从进入 callDeepSeek 起算（≈ 请求开始），贯穿所有重试与 provider 切换：
// 旧版每次重试重新计满 TIMEOUT_CONFIG，最坏情形（首轮打满 + 重试再打满）被 Vercel 直接击杀函数——
// 此时配额已扣、退款/降级分支永远走不到，用户白付一次配额还拿不到结果。
// 留 5s 余量保证抛错后上层还有时间落降级兜底 + 退配额。
const FEATURE_DEADLINE_BUDGET_MS: Record<string, number> = {
  bazi: 55_000, // vercel.json: api/bazi/** maxDuration 60s
  daily: 55_000, // api/daily/** 60s
  tarot: 115_000, // api/tarot/** 120s
  meihua: 55_000, // api/meihua/** 60s
  liuyao: 55_000, // api/liuyao/** 60s
  huangli: 55_000, // api/huangli/** 60s
  huangli_ask: 55_000,
  marriage: 25_000, // 无独立 vercel 配置，按 30s 档保守取 25s
  default: 25_000,
};

// 重试/切 provider 要求的最低剩余预算：低于此值再打一轮也大概率打不完，
// 不如直接抛错，把剩下的时间留给上层落降级兜底 + 退配额。
const RETRY_MIN_BUDGET_MS = 15_000;

function getDeadlineBudget(feature?: string): number {
  if (!feature) return FEATURE_DEADLINE_BUDGET_MS.default;
  return FEATURE_DEADLINE_BUDGET_MS[feature] ?? FEATURE_DEADLINE_BUDGET_MS.default;
}

/** 剩余预算是否够再打一轮（未设 deadline 时恒为 true，行为与改造前一致） */
function hasRetryBudget(deadlineAt?: number): boolean {
  return deadlineAt == null || deadlineAt - Date.now() > RETRY_MIN_BUDGET_MS;
}

/** 预算耗尽错误：message 含 "timed out"，isTimeoutError 会命中 → 上层不再切 provider，直接落降级 */
function budgetExhaustedError(feature?: string): Error {
  return new Error(`AI deadline budget exhausted (timed out), feature=${feature ?? 'default'}`);
}

// 按模块差异化温度：叙事类(塔罗/六爻/梅花)略高求文采与画面感，命理推演类(八字/每日)低温求稳定可复现
const TEMPERATURE_CONFIG: Record<string, number> = {
  bazi: 0.3,
  daily: 0.3,
  marriage: 0.4,
  tarot: 0.6,
  liuyao: 0.5,
  meihua: 0.5,
  default: 0.3,
};

function getTimeout(feature?: string): number {
  if (!feature) return TIMEOUT_CONFIG.default;
  return TIMEOUT_CONFIG[feature] ?? TIMEOUT_CONFIG.default;
}

function getTemperature(feature?: string): number {
  if (!feature) return TEMPERATURE_CONFIG.default;
  return TEMPERATURE_CONFIG[feature] ?? TEMPERATURE_CONFIG.default;
}

// DeepSeek chat 系列输出上限 8k；截断重试的提升上限不超过它，避免网关 400
const MAX_OUTPUT_TOKENS_CAP = 8000;

interface CallDeepSeekOptions {
  /** 走 response_format: json_object，让网关强制返回合法 JSON（system prompt 必须含 "json" 字样） */
  jsonMode?: boolean;
  /** 函数级绝对 deadline（毫秒时间戳）。缺省时按 feature 预算表从进入 callDeepSeek 起算；route 层可传更精确的「请求开始 + 预算」 */
  deadlineAt?: number;
}

function isTimeoutError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('AbortError') || msg.includes('aborted') || msg.includes('timed out');
}

/** 单个 provider+模型的调用：含网络错误与瞬时 5xx 的有限重试；超时/4xx 直接抛出不重试 */
async function callModelOnce(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  feature: string | undefined,
  opts: CallDeepSeekOptions,
  deadlineAt?: number,
): Promise<string> {
  const maxRetries = 3;
  let lastError: unknown;
  // 回复完整性优先：finish_reason=length 说明被 max_tokens 截断，提升上限重试一次
  let effectiveMaxTokens = maxTokens;
  let lengthRetried = false;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // 每次尝试的超时取 min(feature 配置, 剩余 deadline)：重试不重置总预算
    const remainingMs = deadlineAt != null ? deadlineAt - Date.now() : Number.POSITIVE_INFINITY;
    if (remainingMs <= 0) throw budgetExhaustedError(feature);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.min(getTimeout(feature), remainingMs));
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: effectiveMaxTokens,
          temperature: getTemperature(feature),
          enable_thinking: false,
          ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      clearTimeout(timeoutId);
      if (!response.ok) {
        const err = await response.text();
        const apiError = new Error(`DeepSeek API error ${response.status}: ${err}`);
        // 瞬时 5xx(网关抖动)值得再试；4xx 是请求本身有问题，直接抛
        if (response.status >= 500 && attempt < maxRetries - 1) {
          // 重试前查剩余预算：不足 15s 时再试也打不完一轮，直接抛给上层落降级/退款
          if (!hasRetryBudget(deadlineAt)) throw apiError;
          lastError = apiError;
          console.warn(`[callDeepSeek:${model}] ${response.status}, retrying...`);
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        throw apiError;
      }

      const data = await response.json();
      const finishReason = data.choices?.[0]?.finish_reason;
      if (finishReason === 'length') {
        const canRetryLength = !lengthRetried && attempt < maxRetries - 1;
        // 截断重试同样受总预算约束：重试一轮意味着重新生成整篇长文，
        // 预算不够时与其硬打到被 Vercel 击杀，不如把这份「被截断但可用」的内容返回
        // ——上层解析成功就是正常结果，解析失败也还有降级模板，都好过函数被杀。
        if (canRetryLength && hasRetryBudget(deadlineAt)) {
          lengthRetried = true;
          effectiveMaxTokens = Math.min(effectiveMaxTokens * 2, MAX_OUTPUT_TOKENS_CAP);
          console.warn(`[callDeepSeek:${model}] ${feature ?? 'default'} 回复被 max_tokens 截断，提升至 ${effectiveMaxTokens} 重试`);
          continue;
        }
        console.warn(
          `[callDeepSeek:${model}] ${feature ?? 'default'} 回复仍被 max_tokens(${effectiveMaxTokens}) 截断${canRetryLength ? '，但剩余预算不足以重试，直接返回截断内容' : ''}`,
        );
      }
      const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning_content || '';
      if (content.length < 10) {
        const reasoningContent = data.choices?.[0]?.message?.reasoning_content || '';
        if (reasoningContent && /\{[\s\S]*\}/.test(reasoningContent)) {
          return reasoningContent;
        }
      }
      return content;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      // 超时(AbortError)不重试；API error 已在上面按状态码决定过，这里不再重试；仅网络错误重试
      const isAbort = msg.includes('AbortError') || msg.includes('aborted');
      const isApiError = msg.includes('API error');
      if (attempt < maxRetries - 1 && !isAbort && !isApiError) {
        // 重试前查剩余预算（同上：预算不足不再重试）
        if (!hasRetryBudget(deadlineAt)) throw err;
        console.warn(`[callDeepSeek:${model}] attempt ${attempt + 1} failed (${msg}), retrying...`);
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * 调 LLM：按后台开关解析出 [主 provider, 兜底 provider]，主失败(非超时)时切下一个 provider 重试；
 * 全程走熔断保护。两个 provider 模型名一致，切 provider 只换 baseUrl+apiKey。
 * 超时说明本次预算已耗尽，不再切 provider，直接抛给上层落本地降级。
 */
async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2000,
  feature?: string,
  opts: CallDeepSeekOptions = {},
): Promise<string> {
  const providers = await resolveProviders();
  if (!providers.length) throw new Error('无可用 LLM provider（未配置 API key）');

  // route 未显式传时，按 feature 预算表从此刻（≈ 请求开始）起算：
  // 该 deadline 贯穿所有重试与 provider 切换，保证在 Vercel 击杀函数之前抛错，
  // 上层才来得及落降级兜底 + 退配额（旧版每次重试重新计满超时，退款分支永远走不到）
  const deadlineAt = opts.deadlineAt ?? Date.now() + getDeadlineBudget(feature);

  return withCircuitBreaker(`ai:${feature ?? 'default'}`, async () => {
    let lastError: unknown;
    for (let i = 0; i < providers.length; i++) {
      const p = providers[i];
      try {
        return await callModelOnce(p.baseUrl, p.apiKey, PRIMARY_MODEL, systemPrompt, userPrompt, maxTokens, feature, opts, deadlineAt);
      } catch (err) {
        lastError = err;
        if (isTimeoutError(err)) throw err; // 超时不再切 provider
        if (i < providers.length - 1) {
          // 切 provider 前查剩余预算：不足一轮的量就别再开新连接，直接抛给上层落降级/退款
          if (!hasRetryBudget(deadlineAt)) throw err;
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[callDeepSeek] provider ${p.id} 失败 (${msg})，切下一个 provider ${providers[i + 1].id}`);
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  });
}

// 注：原 generateBaziAnalysis（非流式八字解读 + v4:bazi 缓存键）已删除——
// 八字主链路早已全量走 /api/bazi/stream（自带自己的缓存键与流式兜底），全仓零调用
// （唯一残留提及是 api/bazi/route.test.ts 里对 '@/lib/ai' 的 mock 工厂，不依赖真实导出）；
// 保留它只会多维护一套写 v4 键的死代码。下面的降级模板仍被 stream route 依赖，必须保留导出。
export function generateFallbackBaziAnalysis(result: BaziResult): BaziAnalysis {
  const { wuxing, dayMaster } = result;
  const wuxingNames: Record<string, string> = {
    metal: '金', wood: '木', water: '水', fire: '火', earth: '土',
  };
  const entries = Object.entries(wuxing) as [keyof typeof wuxing, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const strongest = wuxingNames[sorted[0][0]];

  return {
    dayMasterAnalysis: `日主为「${dayMaster}」，五行中${strongest}最旺。`,
    personality: '您性格中有多元的特质，善于适应不同环境。',
    career: '事业方面有发展潜力，建议稳步前进。',
    wealth: '财运方面需要稳健理财。',
    relationship: '感情方面宜真诚相待。',
    health: '注意劳逸结合，保持良好作息。',
  };
}

/**
 * 生成每日运势（带 Redis 缓存，24小时过期）
 * 返回值包含 _source 字段：'deepseek' | 'fallback' | 'cache'
 */
export async function generateDailyFortune(
  dayMaster: string,
  targetDate: string,
  dayGanzhi: string,
  dayun = '未知',
  liunian = '未知'
): Promise<{
  overall: number;
  ratings: { career: number; wealth: number; love: number; health: number; studies: number };
  suitable: string[];
  avoid: string[];
  lucky: { color: string; numbers: number[]; direction: string };
  advice: string;
  verse?: string;
  overallLabel?: string;
  luckyHour?: string;
  _source: 'deepseek' | 'fallback' | 'cache';
}> {
  
  // 1. 构建缓存 key（日主 + 日期）
  const cacheKey = `daily:${dayMaster}:${dayun}:${liunian}:${targetDate}`;
  
  // 2. 尝试从 Redis 读取
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      if (process.env.NODE_ENV !== 'production') console.log(`[Cache Hit] ${cacheKey}`);
      return observed('daily', { ...(cached as ReturnType<typeof generateFallbackDailyFortune>), _source: 'cache' });
    }
  } catch (err) {
    console.warn('[Cache Read Error]', err);
  }

  if (!hasAnyProviderKey()) {
    console.warn('[AI] 未配置任何 LLM provider 的 API key，使用降级运势');
    return observed('daily', { ...generateFallbackDailyFortune(), _source: 'fallback' });
  }

  const prompt = buildDailyPrompt(dayMaster, targetDate, dayGanzhi, dayun, liunian);

  const apiResult = await callExternalAPI(
    async () => {
      const text = await callDeepSeek(DAILY_SYSTEM_PROMPT, prompt, 1500, 'daily', { jsonMode: true });
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && parsed.ratings && typeof parsed.ratings === 'object') {
        const keys = ['career', 'wealth', 'love', 'health', 'studies'] as const;
        for (const key of keys) {
          const value = parsed.ratings[key];
          if (typeof value === 'number' && value > 5) {
            parsed.ratings[key] = Math.round(value / 20);
          }
        }
      }
      if (typeof parsed?.overall === 'number' && parsed.overall > 5) {
        parsed.overall = Math.round(parsed.overall / 20);
      }
      return parsed;
    },
    {
      serviceName: 'AI 每日运势',
      fallback: generateFallbackDailyFortune(),
    }
  );

  // 3. 写入 Redis 缓存（仅非降级结果，24小时过期）
  if (apiResult.success) {
    if (!apiResult.fromFallback) {
      const data = apiResult.data; // 快照：延后执行期间不再受 apiResult 变动影响
      const writeCache = async () => {
        try {
          await redis.setex(cacheKey, 86400, data);
          if (process.env.NODE_ENV !== 'production') console.log(`[Cache Set] ${cacheKey} (TTL: 24h)`);
        } catch (err) {
          console.warn('[Cache Write Error]', err);
        }
      };
      // 写缓存搬出用户等待路径：这一步紧接在 20~55s 的 AI 等待之后，而 undici 默认
      // keepAliveTimeout 只有 4s —— 等 AI 期间那条 Redis 连接必然已被回收，这次 setex
      // 要重付一次 TCP+TLS 握手（生产实测 hkg1→Upstash 约 268ms），过去整整计入
      // /api/daily 的响应时间。after() 在 Vercel 上映射到 waitUntil，响应关闭后仍保证执行。
      // 回调自身已吞异常，绝不会 reject 到 after 的错误上报里。
      try {
        after(writeCache);
      } catch {
        // 拿不到 waitUntil 的运行时（单测宿主 / 非 Next 环境 / withAiTimeout 超时后
        // 仍在跑的孤儿调用）after() 会同步抛错：退回原来的内联 await，行为不比改造前差
        await writeCache();
      }
    }
    return observed('daily', { ...apiResult.data, _source: apiResult.fromFallback ? 'fallback' : 'deepseek' });
  }
  
  return observed('daily', { ...generateFallbackDailyFortune(), _source: 'fallback' });
}

function generateFallbackDailyFortune() {
  return {
    overall: 3,
    overallLabel: '平',
    ratings: { career: 3, wealth: 3, love: 3, health: 4, studies: 3 },
    suitable: ['日常工作', '学习提升', '与朋友交流'],
    avoid: ['重大决策', '冒险投资'],
    lucky: { color: '蓝色', numbers: [3, 6], direction: '东方' },
    luckyHour: '午时（11-13时）',
    verse: '行到水穷处\n坐看云起时',
    advice: '今日运势平稳，宜保持平常心，稳步前进。',
  };
}

export interface TarotReadingResult {
  cardMeanings: string[];
  reading: string;
  caution: string;
  /** 一句话答案（PRD-TAROT-V2 P0-B）：直接回答用户的问题，置顶展示。可缺失（旧缓存/兜底） */
  oneLineAnswer?: string;
  /** 行动清单：1-3 条可执行建议。可缺失 */
  actions?: string[];
}

function buildFallbackTarotReading(input: TarotReadingPromptInput): TarotReadingResult {
  const cardMeanings = input.cards.map((card) => {
    const orientation = card.orientation === 'upright' ? '正位' : '逆位';
    const keyword = card.keywords.slice(0, 2).join('、') || '觉察';
    return `${card.position}的${card.name}${orientation}提示你关注“${keyword}”，先稳住当下节奏，再做下一步调整。`;
  });

  return {
    cardMeanings,
    reading:
      '当前 AI 服务暂时不可用，以下为基础牌义参考，建议稍后重新占卜。\n\n' +
      input.cards
        .map(
          (c) =>
            `${c.name}（${c.orientation === 'upright' ? '正位' : '逆位'}）：${c.traditionalMeaning}`
        )
        .join('\n\n'),
    caution: '以上为基础牌义参考，AI 服务暂时不可用，建议稍后重试。',
  };
}

function normalizeTarotReading(
  raw: unknown,
  fallback: TarotReadingResult,
  cardCount: number,
  spread: TarotSpread
): TarotReadingResult {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const cardMeaningsRaw = Array.isArray(data.cardMeanings) ? data.cardMeanings : [];
  const cardMeaningLimit = spread === 'mirror' ? 150 : 120;
  const limits = getTarotTextLimits(spread);

  const cardMeanings = cardMeaningsRaw
    .map((item) => (typeof item === 'string' ? item.replace(/\s+/g, ' ').trim().slice(0, cardMeaningLimit) : ''))
    .filter(Boolean)
    .slice(0, cardCount);

  const normalizedCardMeanings =
    cardMeanings.length === cardCount ? cardMeanings : fallback.cardMeanings.slice(0, cardCount);

  // 一句话答案 / 行动清单（V2 新增，可缺失——前端按缺失降级不渲染）
  const oneLineAnswer =
    typeof data.oneLineAnswer === 'string' && data.oneLineAnswer.trim()
      ? data.oneLineAnswer.replace(/\s+/g, ' ').trim().slice(0, 60)
      : undefined;
  const actions = Array.isArray(data.actions)
    ? data.actions
        .map((a) => (typeof a === 'string' ? a.replace(/\s+/g, ' ').trim().slice(0, 60) : ''))
        .filter(Boolean)
        .slice(0, 3)
    : undefined;

  return {
    cardMeanings: normalizedCardMeanings,
    reading: safeText(data.reading, fallback.reading, limits.reading),
    caution: safeText(data.caution, fallback.caution, limits.caution),
    ...(oneLineAnswer ? { oneLineAnswer } : {}),
    ...(actions && actions.length ? { actions } : {}),
  };
}

interface ReadingLimits {
  cardMeanings: number;
  reading: number;
  caution: number;
}

function getTarotTextLimits(spread: TarotSpread): ReadingLimits {
  if (spread === 'celtic') {
    return {
      cardMeanings: 80,
      reading: 5000,
      caution: 100,
    };
  }
  if (spread === 'mirror') {
    return {
      cardMeanings: 60,
      reading: 4000,
      caution: 100,
    };
  }
  if (spread === 'moonlight') {
    return {
      cardMeanings: 60,
      reading: 4000,
      caution: 100,
    };
  }
  if (spread === 'relationship') {
    return {
      cardMeanings: 120,
      reading: 4000,
      caution: 100,
    };
  }
  return {
    cardMeanings: 60,
    reading: 4000,
    caution: 80,
  };
}

function getTarotMaxTokens(spread: TarotSpread): number {
  if (spread === 'celtic') return 8000;
  if (spread === 'mirror') return 6000;
  if (spread === 'relationship') return 6000;
  return 5000;
}

export async function generateTarotReading(
  input: TarotReadingPromptInput
): Promise<TarotReadingResult & { _source: 'deepseek' | 'fallback' }> {
  const fallback = buildFallbackTarotReading(input);
  if (!hasAnyProviderKey()) {
    return observed('tarot', { ...fallback, _source: 'fallback' });
  }

  try {
    const prompt = buildTarotReadingPrompt(input);
    const systemPrompt = buildTarotReadingSystemPrompt({
      spread: input.spread,
      spreadName: input.spreadName,
    });
    const text = await callDeepSeek(systemPrompt, prompt, getTarotMaxTokens(input.spread), 'tarot', { jsonMode: true });
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[AI 塔罗解读] 无法提取 JSON，text:', text.slice(0, 200));
      return observed('tarot', { ...fallback, _source: 'fallback', _error: `no_json_match: ${text.slice(0, 100)}` } as TarotReadingResult & { _source: 'deepseek' | 'fallback'; _error?: string });
    }

    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    const normalized = normalizeTarotReading(parsed, fallback, input.cards.length, input.spread);
    return observed('tarot', { ...normalized, _source: 'deepseek' });
  } catch (error) {
    const errMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.warn('[AI 塔罗解读] 生成失败，使用降级结果', errMsg);
    let friendlyReason = '请稍后重试';
    if (errMsg.includes('AbortError') || errMsg.includes('abort')) {
      friendlyReason = 'AI 响应超时，请稍后重试';
    } else if (errMsg.includes('fetch failed') || errMsg.includes('ECONNREFUSED') || errMsg.includes('ENOTFOUND')) {
      friendlyReason = '网络连接失败，请稍后重试';
    } else if (errMsg.includes('API error 4')) {
      friendlyReason = 'API 认证错误，请联系管理员';
    }
    const fallbackWithReason = {
      ...fallback,
      caution: `AI 解读失败（${friendlyReason}），以下为基础牌义参考。`,
    };
    return observed('tarot', { ...fallbackWithReason, _source: 'fallback', _error: errMsg } as TarotReadingResult & { _source: 'deepseek' | 'fallback'; _error?: string });
  }
}

export interface MeihuaDecisionResult {
  overallAdvice: string;
  stance: 'go' | 'stop' | 'wait';
  favorable: string[];
  cautions: string[];
  nextSteps: string[];
  insights: {
    thinkingReference: string;
    guaAnalysis: string;
    timingReference: string;
  };
}

function safeText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== 'string') return fallback;
  // 字面 \n 转成真实换行（AI 有时输出字面转义符）
  const unescaped = value.replace(/\\n/g, '\n');
  // 保留段落换行（\n\n），只清理行内多余空白
  const cleaned = unescaped
    .replace(/[^\S\n]+/g, ' ')   // 行内连续空白 → 单空格（保留 \n）
    .replace(/\n{3,}/g, '\n\n') // 3个以上换行 → 2个
    .trim();
  if (!cleaned) return fallback;
  if (cleaned.length <= maxLength) return cleaned;
  // 内容完整度截断：在 maxLength 付近找最近的句子/段落结尾
  const searchZone = cleaned.slice(0, maxLength);
  // 优先找段落结尾（\n\n）
  const paraEnd = searchZone.lastIndexOf('\n\n');
  if (paraEnd > maxLength * 0.6) return cleaned.slice(0, paraEnd).trim();
  // 再找中文句号。！？
  const sentenceMatch = searchZone.match(/[\s\S]*[。！？]/);
  if (sentenceMatch && sentenceMatch[0].length > maxLength * 0.6) {
    return sentenceMatch[0].trim();
  }
  // 再找英文句号
  const engMatch = searchZone.match(/[\s\S]*[.!?]/);
  if (engMatch && engMatch[0].length > maxLength * 0.6) {
    return engMatch[0].trim();
  }
  // fallback: 硬截
  return searchZone.trim();
}

function safeList(
  value: unknown,
  fallback: string[],
  min: number,
  max: number,
  itemMaxLength: number
): string[] {
  if (!Array.isArray(value)) return fallback;
  const list = value
    .map((item) => (typeof item === 'string' ? item.replace(/\s+/g, ' ').trim() : ''))
    .filter(Boolean)
    .slice(0, max)
    .map((item) => item.slice(0, itemMaxLength));

  if (list.length < min) return fallback;
  return list;
}

function resolveStance(value: unknown, overallAdvice: string): 'go' | 'stop' | 'wait' {
  if (value === 'go' || value === 'stop' || value === 'wait') return value;

  if (/不做|暂缓|停止|不宜|放弃/.test(overallAdvice)) return 'stop';
  if (/观望|再看|等待|缓一缓|先稳/.test(overallAdvice)) return 'wait';
  return 'go';
}

function buildFallbackMeihuaDecision(input: MeihuaDecisionPromptInput): MeihuaDecisionResult {
  return {
    overallAdvice: `建议先稳后进，围绕“${input.question.slice(0, 20)}”分阶段判断。`,
    stance: 'wait',
    favorable: [
      '当前卦象显示局面并非僵局，仍有可操作空间。',
      '你已形成明确问题意识，适合做结构化比较。',
    ],
    cautions: ['动爻提示节奏变化较快，避免一次性押注。'],
    nextSteps: [
      '先列出两个可执行方案，分别写明收益、成本与最坏结果。',
      '在 3-7 天内补齐关键信息后，再做最终决定。',
    ],
    insights: {
      thinkingReference: '先拆解“目标-约束-备选方案”，避免情绪主导判断。',
      guaAnalysis: `本卦${input.guaName}转${input.changedGuaName}，提示先稳住基础再推进变化。`,
      timingReference: '短期适合小步试探，确认反馈后再加大投入。',
    },
  };
}

function normalizeMeihuaDecision(raw: unknown, fallback: MeihuaDecisionResult): MeihuaDecisionResult {
  const data = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
  const insightsData = (data.insights && typeof data.insights === 'object')
    ? (data.insights as Record<string, unknown>)
    : {};

  const overallAdvice = safeText(data.overallAdvice, fallback.overallAdvice, 2000);
  const favorable = safeList(data.favorable, fallback.favorable, 2, 3, 40);
  const cautions = safeList(data.cautions, fallback.cautions, 1, 2, 40);
  const nextSteps = safeList(data.nextSteps, fallback.nextSteps, 1, 2, 60);

  return {
    overallAdvice,
    stance: resolveStance(data.stance, overallAdvice),
    favorable,
    cautions,
    nextSteps,
    insights: {
      thinkingReference: safeText(
        insightsData.thinkingReference,
        fallback.insights.thinkingReference,
        70
      ),
      guaAnalysis: safeText(
        insightsData.guaAnalysis,
        fallback.insights.guaAnalysis,
        70
      ),
      timingReference: safeText(
        insightsData.timingReference,
        fallback.insights.timingReference,
        70
      ),
    },
  };
}

/**
 * 梅花易数决策建议（结构化 JSON）
 */
export async function generateMeihuaDecision(
  input: MeihuaDecisionPromptInput
): Promise<MeihuaDecisionResult & { _source: 'deepseek' | 'fallback' }> {
  const fallback = buildFallbackMeihuaDecision(input);
  if (!hasAnyProviderKey()) {
    return observed('meihua', { ...fallback, _source: 'fallback' });
  }

  try {
    const prompt = buildMeihuaDecisionPrompt(input);
    const text = await callDeepSeek(MEIHUA_DECISION_SYSTEM_PROMPT, prompt, 3000, 'meihua', { jsonMode: true });
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return observed('meihua', { ...fallback, _source: 'fallback' });
    }

    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    const normalized = normalizeMeihuaDecision(parsed, fallback);
    return observed('meihua', { ...normalized, _source: 'deepseek' });
  } catch (error) {
    console.warn('[AI 梅花决策] 生成失败，使用降级结果', error);
    return observed('meihua', { ...fallback, _source: 'fallback' });
  }
}

// ─── 六爻占卜 ─────────────────────────────────────

export interface LiuYaoReadingResult {
  lineInterpretations: string[];
  overallNarrative: string;
  summary: string;
  positives: string[];
  cautions: string[];
  actions: string[];
}

function buildFallbackLiuYaoReading(input: LiuYaoPromptInput): LiuYaoReadingResult {
  return {
    lineInterpretations: input.lines.map((l) => {
      const pos = l.type === 'yang' ? '阳刚' : '阴柔';
      return `${l.title}为${pos}之象，${l.originalText}此爻提示在当前阶段宜${l.type === 'yang' ? '积极进取' : '静观其变'}，把握节奏稳步推进。`;
    }),
    overallNarrative: `${input.hexagramName}，上${input.upperTrigram}下${input.lowerTrigram}。${input.judgment}此卦整体提示当前局势正处于转换阶段，需要在行动与等待之间找到平衡。建议先厘清现状，再分步推进，避免操之过急。从卦象结构看，内外卦的关系暗示需要内外兼顾，既要关注自身条件的积累，也要留意外部环境的变化。`,
    summary: '稳中求进，把握节奏，分阶段推进为宜。',
    positives: ['当前形势并非僵局，仍有操作空间。', '内在条件逐步成熟，适合规划布局。'],
    cautions: ['避免急于求成，需循序渐进。'],
    actions: ['先梳理当前最重要的一件事，集中精力突破。', '留出观察期，确认反馈后再加大投入。'],
  };
}

function normalizeLiuYaoReading(raw: unknown, fallback: LiuYaoReadingResult): LiuYaoReadingResult {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const lineInterpretations = Array.isArray(data.lineInterpretations)
    ? data.lineInterpretations
        .map((item) => (typeof item === 'string' ? item.replace(/\s+/g, ' ').trim().slice(0, 150) : ''))
        .filter(Boolean)
        .slice(0, 6)
    : [];

  return {
    lineInterpretations: lineInterpretations.length === 6 ? lineInterpretations : fallback.lineInterpretations,
    overallNarrative: safeText(data.overallNarrative, fallback.overallNarrative, 1200),
    summary: safeText(data.summary, fallback.summary, 60),
    positives: safeList(data.positives, fallback.positives, 2, 3, 80),
    cautions: safeList(data.cautions, fallback.cautions, 1, 2, 80),
    actions: safeList(data.actions, fallback.actions, 1, 2, 100),
  };
}

export async function generateLiuYaoReading(
  input: LiuYaoPromptInput
): Promise<LiuYaoReadingResult & { _source: 'deepseek' | 'fallback'; _error?: string }> {
  const fallback = buildFallbackLiuYaoReading(input);
  if (!hasAnyProviderKey()) {
    return observed('liuyao', { ...fallback, _source: 'fallback' });
  }

  try {
    const prompt = buildLiuYaoPrompt(input);
    const text = await callDeepSeek(LIUYAO_SYSTEM_PROMPT, prompt, 4000, 'liuyao', { jsonMode: true });
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return observed('liuyao', { ...fallback, _source: 'fallback' });
    }

    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    const normalized = normalizeLiuYaoReading(parsed, fallback);
    return observed('liuyao', { ...normalized, _source: 'deepseek' });
  } catch (error) {
    const errMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.warn('[AI 六爻解读] 生成失败，使用降级结果', errMsg);
    return observed('liuyao', { ...fallback, _source: 'fallback', _error: errMsg });
  }
}
