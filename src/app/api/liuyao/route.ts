import { NextRequest, NextResponse } from 'next/server';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { generateLiuYaoReading } from '@/lib/ai/client';
import type { LiuYaoPromptInput } from '@/lib/ai/prompts';
import {
  identifyTrigrams,
  getHexagramName,
  getLineTexts,
  getLineTitle,
  HEXAGRAM_JUDGMENTS,
} from '@/lib/liuyao/data';

interface LiuYaoRequestBody {
  question?: string;
  hexagrams: {
    upper: string;
    lower: string;
    lines: number[]; // 6根爻, 0=阴, 1=阳, 从初爻到上爻
  };
  method: 'manual' | 'coin' | 'time' | 'number';
  divinationTime: string;
}

interface LiuYaoLineResult {
  index: number;
  type: 'yin' | 'yang';
  title: string;
  originalText: string;
  interpretation: string;
}

interface LiuYaoResponse {
  hexagramName: string;
  upperTrigram: string;
  lowerTrigram: string;
  upperSymbol: string;
  lowerSymbol: string;
  lines: LiuYaoLineResult[];
  judgment: string;
  actionAdvice: {
    summary: string;
    positives: string[];
    cautions: string[];
    actions: string[];
  };
  overallNarrative: string;
  _source?: string;
}

function validateRequest(body: unknown): { valid: true; data: LiuYaoRequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: '请求体不能为空' };
  }

  const b = body as Record<string, unknown>;

  if (!b.hexagrams || typeof b.hexagrams !== 'object') {
    return { valid: false, error: '缺少卦象数据' };
  }

  const hex = b.hexagrams as Record<string, unknown>;

  if (!Array.isArray(hex.lines) || hex.lines.length !== 6) {
    return { valid: false, error: '需要6根爻的数据' };
  }

  const lines = hex.lines as number[];
  if (lines.some((l) => l !== 0 && l !== 1)) {
    return { valid: false, error: '爻数据只能为0(阴)或1(阳)' };
  }

  const method = b.method;
  if (method !== 'manual' && method !== 'coin' && method !== 'time' && method !== 'number') {
    return { valid: false, error: '无效的起卦方式' };
  }

  return {
    valid: true,
    data: {
      question: typeof b.question === 'string' ? b.question.trim().slice(0, 200) : '',
      hexagrams: {
        upper: typeof hex.upper === 'string' ? hex.upper : '',
        lower: typeof hex.lower === 'string' ? hex.lower : '',
        lines,
      },
      method: method as LiuYaoRequestBody['method'],
      divinationTime: typeof b.divinationTime === 'string' ? b.divinationTime : new Date().toISOString(),
    },
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const validation = validateRequest(body);

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { data } = validation;
  const { lines } = data.hexagrams;

  const { upperKey, lowerKey, upper, lower } = identifyTrigrams(lines);

  const hexagramName = getHexagramName(upperKey, lowerKey);
  const judgment = HEXAGRAM_JUDGMENTS[hexagramName] || '卦辞待补充。';
  const lineTexts = getLineTexts(hexagramName, lines);

  const linesData: LiuYaoLineResult[] = lines.map((line, index) => ({
    index,
    type: (line === 1 ? 'yang' : 'yin') as 'yin' | 'yang',
    title: getLineTitle(index, line === 1 ? 'yang' : 'yin'),
    originalText: lineTexts[index],
    interpretation: '',
  }));

  const cacheKey = generateCacheKey('liuyao_v1', {
    lines: lines.join(''),
    question: data.question || '',
  });

  const cached = await getCache(cacheKey);
  if (cached && typeof cached === 'object') {
    const c = cached as Record<string, unknown>;
    if (Array.isArray(c.lineInterpretations) && typeof c.overallNarrative === 'string') {
      const cachedLines = linesData.map((l, i) => ({
        ...l,
        interpretation: (c.lineInterpretations as string[])[i] || '',
      }));

      const response: LiuYaoResponse = {
        hexagramName,
        upperTrigram: `${upper.name}（${upper.nature}）`,
        lowerTrigram: `${lower.name}（${lower.nature}）`,
        upperSymbol: upper.symbol,
        lowerSymbol: lower.symbol,
        lines: cachedLines,
        judgment,
        actionAdvice: {
          summary: (c.summary as string) || '',
          positives: (c.positives as string[]) || [],
          cautions: (c.cautions as string[]) || [],
          actions: (c.actions as string[]) || [],
        },
        overallNarrative: c.overallNarrative as string,
        _source: 'cache',
      };

      return NextResponse.json(response);
    }
  }

  const promptInput: LiuYaoPromptInput = {
    question: data.question || '',
    hexagramName,
    upperTrigram: `${upper.name}（${upper.nature}）`,
    lowerTrigram: `${lower.name}（${lower.nature}）`,
    lines: linesData.map((l) => ({
      index: l.index,
      type: l.type,
      title: l.title,
      originalText: l.originalText,
    })),
    judgment,
    divinationTime: data.divinationTime,
  };

  const reading = await generateLiuYaoReading(promptInput);

  const enrichedLines = linesData.map((l, i) => ({
    ...l,
    interpretation: reading.lineInterpretations[i] || '',
  }));

  await setCache(cacheKey, {
    lineInterpretations: reading.lineInterpretations,
    overallNarrative: reading.overallNarrative,
    summary: reading.summary,
    positives: reading.positives,
    cautions: reading.cautions,
    actions: reading.actions,
  }, 12 * 60 * 60);

  const response: LiuYaoResponse = {
    hexagramName,
    upperTrigram: `${upper.name}（${upper.nature}）`,
    lowerTrigram: `${lower.name}（${lower.nature}）`,
    upperSymbol: upper.symbol,
    lowerSymbol: lower.symbol,
    lines: enrichedLines,
    judgment,
    actionAdvice: {
      summary: reading.summary,
      positives: reading.positives,
      cautions: reading.cautions,
      actions: reading.actions,
    },
    overallNarrative: reading.overallNarrative,
    _source: reading._source,
  };

  return NextResponse.json(response);
}
