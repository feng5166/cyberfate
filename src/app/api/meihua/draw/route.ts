import { NextRequest, NextResponse } from 'next/server';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';

type DrawMethod = 'time' | 'number' | 'manual';

interface BaguaItem {
  name: string;
  symbol: string;
  meaning: string;
  // 从下到上：阳爻=1，阴爻=0
  lines: [number, number, number];
}

const BAGUA: BaguaItem[] = [
  { name: '乾', symbol: '☰', meaning: '天', lines: [1, 1, 1] },
  { name: '兑', symbol: '☱', meaning: '泽', lines: [1, 1, 0] },
  { name: '离', symbol: '☲', meaning: '火', lines: [1, 0, 1] },
  { name: '震', symbol: '☳', meaning: '雷', lines: [1, 0, 0] },
  { name: '巽', symbol: '☴', meaning: '风', lines: [0, 1, 1] },
  { name: '坎', symbol: '☵', meaning: '水', lines: [0, 1, 0] },
  { name: '艮', symbol: '☶', meaning: '山', lines: [0, 0, 1] },
  { name: '坤', symbol: '☷', meaning: '地', lines: [0, 0, 0] },
];

const BAGUA_BY_LINES = new Map<string, BaguaItem>(
  BAGUA.map((item) => [item.lines.join(''), item])
);

interface GuaPair {
  upper: BaguaItem;
  lower: BaguaItem;
  gua: string;
  guaName: string;
  guaSymbol: string;
}

function positiveMod(value: number, modulo: number): number {
  return ((value % modulo) + modulo) % modulo;
}

function parseNumber(value: unknown, fallback = 1): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function buildPair(upperIndex: number, lowerIndex: number): GuaPair {
  const upper = BAGUA[upperIndex] ?? BAGUA[0];
  const lower = BAGUA[lowerIndex] ?? BAGUA[0];
  return {
    upper,
    lower,
    gua: `${upper.symbol}\n${lower.symbol}`,
    guaName: `${upper.meaning}${lower.meaning}`,
    guaSymbol: `${upper.symbol}${lower.symbol}`,
  };
}

function resolveDraw(method: DrawMethod, numbers?: { num1?: unknown; num2?: unknown }) {
  const now = new Date();

  if (method === 'time') {
    const upperIndex = positiveMod(now.getHours() + now.getMinutes(), 8);
    const lowerIndex = positiveMod(now.getMinutes() + now.getSeconds(), 8);
    const movingLine = positiveMod(now.getHours() + now.getMinutes() + now.getSeconds(), 6) + 1;
    return { upperIndex, lowerIndex, movingLine };
  }

  const num1 = parseNumber(numbers?.num1, 1);
  const num2 = parseNumber(numbers?.num2, 1);
  const upperIndex = positiveMod(num1, 8);
  const lowerIndex = positiveMod(num2, 8);
  const movingLine = positiveMod(num1 + num2, 6) + 1;

  return { upperIndex, lowerIndex, movingLine };
}

function getChangedPair(primary: GuaPair, movingLine: number): GuaPair {
  const lines = [...primary.lower.lines, ...primary.upper.lines] as number[];
  const lineIndex = Math.min(5, Math.max(0, movingLine - 1));
  lines[lineIndex] = lines[lineIndex] === 1 ? 0 : 1;

  const changedLowerLines = `${lines[0]}${lines[1]}${lines[2]}`;
  const changedUpperLines = `${lines[3]}${lines[4]}${lines[5]}`;

  const changedLower = BAGUA_BY_LINES.get(changedLowerLines) ?? primary.lower;
  const changedUpper = BAGUA_BY_LINES.get(changedUpperLines) ?? primary.upper;

  return {
    upper: changedUpper,
    lower: changedLower,
    gua: `${changedUpper.symbol}\n${changedLower.symbol}`,
    guaName: `${changedUpper.meaning}${changedLower.meaning}`,
    guaSymbol: `${changedUpper.symbol}${changedLower.symbol}`,
  };
}

function firstSentence(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  const sentence = normalized.split(/[。！？]/).map((item) => item.trim()).find(Boolean);
  return sentence ? `${sentence}。` : normalized;
}

export async function POST(req: NextRequest) {
  // Security Fix: SEC-012 — 添加登录检查
  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const method = (body?.method as DrawMethod) || 'time';
  const numbers = body?.numbers as { num1?: unknown; num2?: unknown } | undefined;

  if (!['time', 'number', 'manual'].includes(method)) {
    return NextResponse.json({ error: '无效的起卦方式' }, { status: 400 });
  }

  if (method === 'manual') {
    return NextResponse.json({ error: '手动起卦即将上线，请先选择时间起卦或数字起卦。' }, { status: 400 });
  }

  const { upperIndex, lowerIndex, movingLine } = resolveDraw(method, numbers);
  const primary = buildPair(upperIndex, lowerIndex);
  const changed = getChangedPair(primary, movingLine);

  const cacheKey = generateCacheKey('meihua', {
    method,
    upper: primary.upper.name,
    lower: primary.lower.name,
    movingLine,
  });

  const cached = await getCache(cacheKey);
  if (cached?.analysis) {
    const cachedAnalysis = String(cached.analysis);
    return NextResponse.json({
      gua: primary.gua,
      guaName: primary.guaName,
      upper: primary.upper.name,
      lower: primary.lower.name,
      changedGua: changed.gua,
      changedGuaName: changed.guaName,
      movingLine,
      primary,
      changed,
      analysis: cachedAnalysis,
      guaCi: firstSentence(cachedAnalysis),
      _source: 'cache',
    });
  }

  const prompt = `你是"赛博命理师"的梅花易数解卦引擎。

【卦象信息】
本卦：${primary.guaName}（${primary.upper.name}上${primary.lower.name}下，${primary.guaSymbol}）
变卦：${changed.guaName}（${changed.upper.name}上${changed.lower.name}下，${changed.guaSymbol}）
动爻：第${movingLine}爻

【输出规则】
- 直接输出正文，不加前言和免责声明
- 总字数控制在 160-220 字
- 语气客观、温和、可执行

【输出结构】
【卦象含义】
解释本卦与变卦的关系与趋势。

【吉凶判断】
给出当下趋势判断与注意点。

【行动建议】
给出 3 条以内可执行建议。`;

  let analysis = '';
  let aiSource = 'fallback';

  try {
    const aiResponse = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        max_tokens: 420,
        temperature: 0.3,
        enable_thinking: false,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      analysis = aiData.choices?.[0]?.message?.content || '解读生成失败';
      aiSource = 'deepseek';
      await setCache(cacheKey, { analysis });
    }
  } catch (error) {
    console.error('[Meihua Draw] AI call failed:', error);
  }

  if (!analysis) {
    analysis = '【卦象含义】当下处于变化交替期，宜先看清局势再推进。\n\n【吉凶判断】整体可为，但节奏不宜过急。\n\n【行动建议】先厘清目标，再按轻重缓急分步推进。';
  }

  return NextResponse.json({
    gua: primary.gua,
    guaName: primary.guaName,
    upper: primary.upper.name,
    lower: primary.lower.name,
    changedGua: changed.gua,
    changedGuaName: changed.guaName,
    movingLine,
    primary,
    changed,
    analysis,
    guaCi: firstSentence(analysis),
    _source: aiSource,
  });
}
