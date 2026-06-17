/**
 * 梅花易数起卦核心算法(纯函数,可单测)
 * 从 src/app/api/meihua/draw/route.ts 抽出,便于 import 测试。
 */

export type DrawMethod = 'time' | 'number' | 'manual';

export interface BaguaItem {
  name: string;
  symbol: string;
  meaning: string;
  lines: [number, number, number];
}

export interface GuaPair {
  upper: BaguaItem;
  lower: BaguaItem;
  gua: string;
  guaName: string;
  guaSymbol: string;
}

// 先天八卦序:数 1=乾 … 数 8=坤(下标 0..7)
export const BAGUA: BaguaItem[] = [
  { name: '乾', symbol: '☰', meaning: '天', lines: [1, 1, 1] },
  { name: '兑', symbol: '☱', meaning: '泽', lines: [1, 1, 0] },
  { name: '离', symbol: '☲', meaning: '火', lines: [1, 0, 1] },
  { name: '震', symbol: '☳', meaning: '雷', lines: [1, 0, 0] },
  { name: '巽', symbol: '☴', meaning: '风', lines: [0, 1, 1] },
  { name: '坎', symbol: '☵', meaning: '水', lines: [0, 1, 0] },
  { name: '艮', symbol: '☶', meaning: '山', lines: [0, 0, 1] },
  { name: '坤', symbol: '☷', meaning: '地', lines: [0, 0, 0] },
];

export const BAGUA_BY_LINES = new Map<string, BaguaItem>(
  BAGUA.map((item) => [item.lines.join(''), item])
);

export function positiveMod(value: number, modulo: number): number {
  return ((value % modulo) + modulo) % modulo;
}

export function parseNumber(value: unknown, fallback = 1): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export function buildPair(upperIndex: number, lowerIndex: number): GuaPair {
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

/**
 * 卦数 → 数组下标。先天八卦数 1=乾…8=坤,余 8(即 %8==0)取坤。
 * 对 0 基数组:下标 = (数 - 1) mod 8。
 */
export function numberToTrigramIndex(n: number): number {
  return positiveMod(n - 1, 8);
}

/** 动爻:总和取 6,余 0 取第 6 爻(上爻),否则取余数。结果 ∈ [1,6]。 */
export function movingLineFromSum(sum: number): number {
  const r = positiveMod(sum, 6);
  return r === 0 ? 6 : r;
}

/** 数字起卦(确定性)。 */
export function resolveNumberDraw(num1: number, num2: number) {
  const upperIndex = numberToTrigramIndex(num1);
  const lowerIndex = numberToTrigramIndex(num2);
  const movingLine = movingLineFromSum(num1 + num2);
  return { upperIndex, lowerIndex, movingLine };
}

/** 时间起卦。now 作为参数注入,便于测试(替代内部 new Date())。 */
export function resolveTimeDraw(now: Date) {
  const upperIndex = numberToTrigramIndex(now.getHours() + now.getMinutes());
  const lowerIndex = numberToTrigramIndex(now.getMinutes() + now.getSeconds());
  const movingLine = movingLineFromSum(now.getHours() + now.getMinutes() + now.getSeconds());
  return { upperIndex, lowerIndex, movingLine };
}

export function resolveDraw(
  method: DrawMethod,
  numbers: { num1?: unknown; num2?: unknown } | undefined,
  now: Date
) {
  if (method === 'time') return resolveTimeDraw(now);
  const num1 = parseNumber(numbers?.num1, 1);
  const num2 = parseNumber(numbers?.num2, 1);
  return resolveNumberDraw(num1, num2);
}

export function getChangedPair(primary: GuaPair, movingLine: number): GuaPair {
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
