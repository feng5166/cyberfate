import { describe, it, expect } from 'vitest';
import {
  BAGUA,
  resolveNumberDraw,
  resolveTimeDraw,
  resolveDraw,
  parseNumber,
  buildPair,
  getChangedPair,
} from './draw';

describe('梅花数字起卦 — 卦数↔卦 映射 (C2 回归)', () => {
  // 先天八卦数:乾1 兑2 离3 震4 巽5 坎6 艮7 坤8;余 8 取坤(上卦),即数字 N → 第 N 卦
  it.each([
    [1, '乾'],
    [2, '兑'],
    [3, '离'],
    [4, '震'],
    [5, '巽'],
    [6, '坎'],
    [7, '艮'],
    [8, '坤'],
    [9, '乾'], // 9 mod 8 → 1 → 乾(回绕)
    [16, '坤'], // 16 → 余 8 → 坤
  ])('数字 %i 应得上卦「%s」', (num, expectedName) => {
    const { upperIndex } = resolveNumberDraw(num, num);
    expect(BAGUA[upperIndex].name).toBe(expectedName);
  });

  it('上/下卦分别由 num1/num2 决定', () => {
    const { upperIndex, lowerIndex } = resolveNumberDraw(1, 8); // 乾上 坤下
    expect(BAGUA[upperIndex].name).toBe('乾');
    expect(BAGUA[lowerIndex].name).toBe('坤');
  });
});

describe('梅花动爻 (C2 回归)', () => {
  // 动爻 =(上数+下数)取 6,余 0 取第 6 爻(上爻),否则取余数
  it.each([
    [1, 1, 2], // 和 2 → 第 2 爻
    [3, 3, 6], // 和 6 → 余 0 → 第 6 爻
    [6, 6, 6], // 和 12 → 余 0 → 第 6 爻
    [1, 6, 1], // 和 7 → 余 1 → 第 1 爻
  ])('num1=%i num2=%i → 动爻第 %i', (a, b, expected) => {
    const { movingLine } = resolveNumberDraw(a, b);
    expect(movingLine).toBe(expected);
  });

  it('动爻恒在 [1,6](属性测试)', () => {
    for (let a = 1; a <= 50; a++) {
      for (let b = 1; b <= 50; b++) {
        const { movingLine } = resolveNumberDraw(a, b);
        expect(movingLine).toBeGreaterThanOrEqual(1);
        expect(movingLine).toBeLessThanOrEqual(6);
      }
    }
  });
});

describe('梅花卦下标边界(属性)', () => {
  it('任意数字起卦的上下卦下标都在 [0,7]', () => {
    for (let n = 0; n <= 64; n++) {
      const { upperIndex, lowerIndex } = resolveNumberDraw(n, n + 3);
      expect(upperIndex).toBeGreaterThanOrEqual(0);
      expect(upperIndex).toBeLessThanOrEqual(7);
      expect(lowerIndex).toBeGreaterThanOrEqual(0);
      expect(lowerIndex).toBeLessThanOrEqual(7);
    }
  });

  it('时间起卦同样落在合法范围', () => {
    const { upperIndex, lowerIndex, movingLine } = resolveTimeDraw(
      new Date('2026-06-17T08:30:45')
    );
    expect(upperIndex).toBeGreaterThanOrEqual(0);
    expect(upperIndex).toBeLessThanOrEqual(7);
    expect(lowerIndex).toBeGreaterThanOrEqual(0);
    expect(lowerIndex).toBeLessThanOrEqual(7);
    expect(movingLine).toBeGreaterThanOrEqual(1);
    expect(movingLine).toBeLessThanOrEqual(6);
  });
});

describe('变卦:翻动爻得到合法卦', () => {
  it('乾上乾下(全阳)动第 1 爻 → 下卦变巽', () => {
    const primary = buildPair(0, 0); // 乾上 乾下
    const changed = getChangedPair(primary, 1); // 翻最下爻 1→0:下卦 111→011=巽
    expect(changed.lower.name).toBe('巽');
    expect(changed.upper.name).toBe('乾');
  });
});

describe('parseNumber 分支', () => {
  it('有限数字原样返回', () => {
    expect(parseNumber(7)).toBe(7);
    expect(parseNumber(0)).toBe(0);
  });

  it('数字字符串被解析', () => {
    expect(parseNumber('5')).toBe(5);
    expect(parseNumber('  12 ')).toBe(12);
  });

  it('非有限数字 / 非数字字符串 / 其它类型 → 兜底值', () => {
    expect(parseNumber(NaN)).toBe(1); // Number.isFinite=false
    expect(parseNumber(Infinity)).toBe(1);
    expect(parseNumber('abc')).toBe(1); // parseInt → NaN
    expect(parseNumber('')).toBe(1); // 空串 trim 为假
    expect(parseNumber(null)).toBe(1);
    expect(parseNumber(undefined)).toBe(1);
    expect(parseNumber({})).toBe(1);
    expect(parseNumber('99', 3)).toBe(99); // 自定义兜底不触发
    expect(parseNumber(null, 8)).toBe(8); // 自定义兜底触发
  });
});

describe('resolveDraw 派发器', () => {
  const fixedNow = new Date('2026-06-17T08:30:45');

  it("method='time' 走时间起卦(与 resolveTimeDraw 一致)", () => {
    expect(resolveDraw('time', undefined, fixedNow)).toEqual(resolveTimeDraw(fixedNow));
  });

  it("method='number' 解析字符串入参(与 resolveNumberDraw 一致)", () => {
    expect(resolveDraw('number', { num1: '3', num2: '5' }, fixedNow)).toEqual(
      resolveNumberDraw(3, 5)
    );
  });

  it("method='number' 缺省入参回退到 1/1", () => {
    expect(resolveDraw('number', undefined, fixedNow)).toEqual(resolveNumberDraw(1, 1));
  });
});

describe('buildPair 越界兜底', () => {
  it('非法下标回退到 BAGUA[0](乾)', () => {
    const pair = buildPair(99, -1);
    expect(pair.upper).toBe(BAGUA[0]);
    expect(pair.lower).toBe(BAGUA[0]);
    expect(pair.upper.name).toBe('乾');
  });
});
