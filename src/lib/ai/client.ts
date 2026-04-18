import crypto from 'crypto';
import {
  buildBaziPrompt,
  buildDailyPrompt,
  buildLiuYaoPrompt,
  buildMeihuaDecisionPrompt,
  buildTarotReadingPrompt,
  buildTarotReadingSystemPrompt,
  BAZI_SYSTEM_PROMPT,
  DAILY_SYSTEM_PROMPT,
  LIUYAO_SYSTEM_PROMPT,
  MEIHUA_DECISION_SYSTEM_PROMPT,
  type LiuYaoPromptInput,
  type MeihuaDecisionPromptInput,
  type TarotReadingPromptInput,
  type TarotSpread,
} from './prompts';
import type { BaziResult, BaziAnalysis } from '../bazi/types';
import { callExternalAPI, getEnvVar } from '../utils/api-wrapper';
import { redis } from '../cache/redis';

const DEEPSEEK_BASE_URL = 'https://api.modelverse.cn/v1';
const DEEPSEEK_MODEL = 'deepseek-ai/DeepSeek-V3.2';

async function callDeepSeek(systemPrompt: string, userPrompt: string, maxTokens = 800): Promise<string> {
  const apiKey = getEnvVar('DEEPSEEK_API_KEY');
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY 未配置');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  clearTimeout(timeoutId);
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * 生成八字分析（带 Redis 缓存）
 * 返回值包含 _source 字段：'deepseek' | 'fallback' | 'cache'
 */
export async function generateBaziAnalysis(
  result: BaziResult,
  name?: string,
  birthInfo?: { birthDate: string; birthHour: number }
): Promise<BaziAnalysis & { _source: 'deepseek' | 'fallback' | 'cache' }> {
  
  // 1. 构建缓存 key（hash摘要，避免明文PII写入Redis）
  let cacheKey = 'bazi:default';
  if (birthInfo) {
    const { birthDate, birthHour } = birthInfo;
    const hash = crypto.createHash('sha256').update(JSON.stringify({ birthDate, birthHour, gender: undefined })).digest('hex').slice(0, 16);
    cacheKey = `bazi:${hash}`;
  }
  
  // 2. 尝试从 Redis 读取
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[Cache Hit] ${cacheKey}`);
      return { ...(cached as BaziAnalysis), _source: 'cache' };
    }
  } catch (err) {
    console.warn('[Cache Read Error]', err);
  }

  const apiKey = getEnvVar('DEEPSEEK_API_KEY');
  if (!apiKey) {
    console.warn('[AI] DEEPSEEK_API_KEY 未配置，使用降级分析');
    return { ...generateFallbackBaziAnalysis(result), _source: 'fallback' };
  }

  const prompt = buildBaziPrompt(result, name);

  const apiResult = await callExternalAPI(
    async () => {
      const text = await callDeepSeek(BAZI_SYSTEM_PROMPT, prompt, 800);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      return JSON.parse(jsonMatch[0]) as BaziAnalysis;
    },
    {
      serviceName: 'AI 八字分析',
      fallback: generateFallbackBaziAnalysis(result),
    }
  );

  // 3. 写入 Redis 缓存（仅非降级结果）
  if (apiResult.success) {
    if (!apiResult.fromFallback) {
      try {
        await redis.set(cacheKey, apiResult.data);
        console.log(`[Cache Set] ${cacheKey}`);
      } catch (err) {
        console.warn('[Cache Write Error]', err);
      }
    }
    return { ...apiResult.data, _source: apiResult.fromFallback ? 'fallback' : 'deepseek' };
  }
  
  return { ...generateFallbackBaziAnalysis(result), _source: 'fallback' };
}

function generateFallbackBaziAnalysis(result: BaziResult): BaziAnalysis {
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
  _source: 'deepseek' | 'fallback' | 'cache';
}> {
  
  // 1. 构建缓存 key（日主 + 日期）
  const cacheKey = `daily:${dayMaster}:${dayun}:${liunian}:${targetDate}`;
  
  // 2. 尝试从 Redis 读取
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[Cache Hit] ${cacheKey}`);
      return { ...(cached as ReturnType<typeof generateFallbackDailyFortune>), _source: 'cache' };
    }
  } catch (err) {
    console.warn('[Cache Read Error]', err);
  }

  const apiKey = getEnvVar('DEEPSEEK_API_KEY');
  if (!apiKey) {
    console.warn('[AI] DEEPSEEK_API_KEY 未配置，使用降级运势');
    return { ...generateFallbackDailyFortune(), _source: 'fallback' };
  }

  const prompt = buildDailyPrompt(dayMaster, targetDate, dayGanzhi, dayun, liunian);

  const apiResult = await callExternalAPI(
    async () => {
      const text = await callDeepSeek(DAILY_SYSTEM_PROMPT, prompt, 600);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      return JSON.parse(jsonMatch[0]);
    },
    {
      serviceName: 'AI 每日运势',
      fallback: generateFallbackDailyFortune(),
    }
  );

  // 3. 写入 Redis 缓存（仅非降级结果，24小时过期）
  if (apiResult.success) {
    if (!apiResult.fromFallback) {
      try {
        await redis.setex(cacheKey, 86400, apiResult.data);
        console.log(`[Cache Set] ${cacheKey} (TTL: 24h)`);
      } catch (err) {
        console.warn('[Cache Write Error]', err);
      }
    }
    return { ...apiResult.data, _source: apiResult.fromFallback ? 'fallback' : 'deepseek' };
  }
  
  return { ...generateFallbackDailyFortune(), _source: 'fallback' };
}

function generateFallbackDailyFortune() {
  return {
    overall: 3,
    ratings: { career: 3, wealth: 3, love: 3, health: 4, studies: 3 },
    suitable: ['日常工作', '学习提升', '与朋友交流'],
    avoid: ['重大决策', '冒险投资'],
    lucky: { color: '蓝色', numbers: [3, 6], direction: '东方' },
    advice: '今日运势平稳，宜保持平常心，稳步前进。',
  };
}

export interface TarotReadingResult {
  cardMeanings: string[];
  overallNarrative: string;
  detailedReading: string;
  advice: string;
  caution: string;
}

function buildFallbackTarotReading(input: TarotReadingPromptInput): TarotReadingResult {
  const cardMeanings = input.cards.map((card) => {
    const orientation = card.orientation === 'upright' ? '正位' : '逆位';
    const keyword = card.keywords.slice(0, 2).join('、') || '觉察';
    return `${card.position}的${card.name}${orientation}提示你关注“${keyword}”，先稳住当下节奏，再做下一步调整。`;
  });

  const focus = input.question?.trim()
    ? `围绕“${input.question.trim().slice(0, 24)}”这个主题，`
    : '';

  return {
    cardMeanings,
    overallNarrative:
      `${focus}这组牌先回顾过往影响，再指向当前课题，最后落到未来趋势。整体不是僵局，而是“先看清、再行动”的过程。`,
    detailedReading:
      `${focus}过去阶段的经验仍在影响判断，因此需要先辨别哪些执念在拖慢节奏。当前牌面更强调现实执行力与边界感，适合把目标拆解为可验证的小步骤，先解决最关键的一件事。未来走势显示只要保持稳定投入，局势会逐步明朗，并在一到两个阶段后看到更清晰的方向。行动上建议先收集关键信息，再做节奏控制，避免情绪化决定。`,
    advice: '把目标拆成 3 个可执行动作：先确认事实，再设时间节点，最后按轻重缓急推进。',
    caution: '避免因为一时焦虑而仓促定论，先验证信息再表态。',
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

  return {
    cardMeanings: normalizedCardMeanings,
    overallNarrative: safeText(data.overallNarrative, fallback.overallNarrative, limits.overallNarrative),
    detailedReading: safeText(data.detailedReading, fallback.detailedReading, limits.detailedReading),
    advice: safeText(data.advice, fallback.advice, limits.advice),
    caution: safeText(data.caution, fallback.caution, limits.caution),
  };
}

function getTarotTextLimits(spread: TarotSpread): {
  overallNarrative: number;
  detailedReading: number;
  advice: number;
  caution: number;
} {
  if (spread === 'celtic') {
    return {
      overallNarrative: 1300,
      detailedReading: 520,
      advice: 160,
      caution: 100,
    };
  }
  if (spread === 'mirror') {
    return {
      overallNarrative: 860,
      detailedReading: 420,
      advice: 140,
      caution: 100,
    };
  }
  return {
    overallNarrative: 620,
    detailedReading: 340,
    advice: 120,
    caution: 80,
  };
}

function getTarotMaxTokens(spread: TarotSpread): number {
  if (spread === 'celtic') return 2600;
  if (spread === 'mirror') return 1800;
  return 1200;
}

export async function generateTarotReading(
  input: TarotReadingPromptInput
): Promise<TarotReadingResult & { _source: 'deepseek' | 'fallback' }> {
  const fallback = buildFallbackTarotReading(input);
  const apiKey = getEnvVar('DEEPSEEK_API_KEY');

  if (!apiKey) {
    return { ...fallback, _source: 'fallback' };
  }

  try {
    const prompt = buildTarotReadingPrompt(input);
    const systemPrompt = buildTarotReadingSystemPrompt({
      spread: input.spread,
      spreadName: input.spreadName,
    });
    const text = await callDeepSeek(systemPrompt, prompt, getTarotMaxTokens(input.spread));
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { ...fallback, _source: 'fallback' };
    }

    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    const normalized = normalizeTarotReading(parsed, fallback, input.cards.length, input.spread);
    return { ...normalized, _source: 'deepseek' };
  } catch (error) {
    console.warn('[AI 塔罗解读] 生成失败，使用降级结果', error);
    return { ...fallback, _source: 'fallback' };
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
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, maxLength);
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

  const overallAdvice = safeText(data.overallAdvice, fallback.overallAdvice, 60);
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
  const apiKey = getEnvVar('DEEPSEEK_API_KEY');

  if (!apiKey) {
    return { ...fallback, _source: 'fallback' };
  }

  try {
    const prompt = buildMeihuaDecisionPrompt(input);
    const text = await callDeepSeek(MEIHUA_DECISION_SYSTEM_PROMPT, prompt, 700);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { ...fallback, _source: 'fallback' };
    }

    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    const normalized = normalizeMeihuaDecision(parsed, fallback);
    return { ...normalized, _source: 'deepseek' };
  } catch (error) {
    console.warn('[AI 梅花决策] 生成失败，使用降级结果', error);
    return { ...fallback, _source: 'fallback' };
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
    overallNarrative: safeText(data.overallNarrative, fallback.overallNarrative, 400),
    summary: safeText(data.summary, fallback.summary, 60),
    positives: safeList(data.positives, fallback.positives, 2, 3, 30),
    cautions: safeList(data.cautions, fallback.cautions, 1, 2, 30),
    actions: safeList(data.actions, fallback.actions, 1, 2, 50),
  };
}

export async function generateLiuYaoReading(
  input: LiuYaoPromptInput
): Promise<LiuYaoReadingResult & { _source: 'deepseek' | 'fallback' }> {
  const fallback = buildFallbackLiuYaoReading(input);
  const apiKey = getEnvVar('DEEPSEEK_API_KEY');

  if (!apiKey) {
    return { ...fallback, _source: 'fallback' };
  }

  try {
    const prompt = buildLiuYaoPrompt(input);
    const text = await callDeepSeek(LIUYAO_SYSTEM_PROMPT, prompt, 1200);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { ...fallback, _source: 'fallback' };
    }

    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    const normalized = normalizeLiuYaoReading(parsed, fallback);
    return { ...normalized, _source: 'deepseek' };
  } catch (error) {
    console.warn('[AI 六爻解读] 生成失败，使用降级结果', error);
    return { ...fallback, _source: 'fallback' };
  }
}
