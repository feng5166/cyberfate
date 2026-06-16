import { NextRequest, NextResponse } from 'next/server';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { AI_BASE_URL, PRIMARY_MODEL } from '@/lib/ai/models';

type DrawMethod = 'time' | 'number' | 'manual';

interface BaguaItem {
  name: string;
  symbol: string;
  meaning: string;
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
    const upperSum = now.getHours() + now.getMinutes();
    const lowerSum = now.getMinutes() + now.getSeconds();
    const moveSum = now.getHours() + now.getMinutes() + now.getSeconds();
    const upperIndex = positiveMod(upperSum - 1, 8);
    const lowerIndex = positiveMod(lowerSum - 1, 8);
    const movingLine = moveSum % 6 === 0 ? 6 : moveSum % 6;
    return { upperIndex, lowerIndex, movingLine };
  }

  const num1 = parseNumber(numbers?.num1, 1);
  const num2 = parseNumber(numbers?.num2, 1);
  const upperIndex = positiveMod(num1 - 1, 8);
  const lowerIndex = positiveMod(num2 - 1, 8);
  const sumForLine = num1 + num2;
  const movingLine = sumForLine % 6 === 0 ? 6 : sumForLine % 6;

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

const FALLBACK_ANALYSIS =
  '【卦象含义】当下处于变化交替期，宜先看清局势再推进。\n\n【吉凶判断】整体可为，但节奏不宜过急。\n\n【行动建议】先厘清目标，再按轻重缓急分步推进。';

export async function POST(req: NextRequest) {
  const debugToken = req.headers.get('x-debug-token');
  const isDebugMode = !!(debugToken && debugToken === process.env.TAROT_DEBUG_TOKEN);

  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  if (!isDebugMode && !session?.user?.id) {
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

  const meta = {
    gua: primary.gua,
    guaName: primary.guaName,
    upper: primary.upper.name,
    lower: primary.lower.name,
    changedGua: changed.gua,
    changedGuaName: changed.guaName,
    movingLine,
    primary,
    changed,
  };

  const encoder = new TextEncoder();

  const cached = await getCache(cacheKey);
  if (cached?.analysis) {
    const cachedAnalysis = String(cached.analysis);
    const guaCi = firstSentence(cachedAnalysis);
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ meta: { ...meta, guaCi, _source: 'cache' } })}\n\n`
          )
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ content: cachedAnalysis })}\n\n`)
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
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

  let upstream: Response | null = null;
  try {
    upstream = await fetch(`${AI_BASE_URL}/chat/completions`, {
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
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } catch (error) {
    console.error('[Meihua Draw] AI call failed:', error);
  }

  if (!upstream || !upstream.ok || !upstream.body) {
    const guaCi = firstSentence(FALLBACK_ANALYSIS);
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ meta: { ...meta, guaCi, _source: 'fallback' } })}\n\n`
          )
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ content: FALLBACK_ANALYSIS })}\n\n`)
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  const upstreamBody = upstream.body;

  const readable = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ meta: { ...meta, _source: 'deepseek' } })}\n\n`)
      );

      const reader = upstreamBody.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') {
              continue;
            }
            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            } catch {}
          }
        }
        if (fullText) {
          try {
            await setCache(cacheKey, { analysis: fullText });
          } catch (err) {
            console.warn('[Meihua Draw] cache write failed:', err);
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        console.error('[Meihua Draw] stream error:', err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
