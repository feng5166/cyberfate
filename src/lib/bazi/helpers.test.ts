import { describe, it, expect } from 'vitest';
import { getTenGod, getNaYin } from './helpers';
import { TIANGAN_LIST } from './constants';
import type { TianGan, DiZhi } from './types';

describe('getTenGod (十神)', () => {
  it('same gan as day master is 比肩', () => {
    expect(getTenGod('甲', '甲')).toBe('比肩');
    expect(getTenGod('癸', '癸')).toBe('比肩');
  });

  it('same element, same polarity = 比肩; same element, opposite polarity = 劫财', () => {
    // 甲(阳木) vs 乙(阴木): same element, diff polarity -> 劫财
    expect(getTenGod('甲', '乙')).toBe('劫财');
    // 丙(阳火) vs 丁(阴火): 劫财
    expect(getTenGod('丙', '丁')).toBe('劫财');
  });

  it('day generates target (我生): 食神 (same polarity) / 伤官 (diff)', () => {
    // 甲(阳木) 生 丙(阳火): same polarity -> 食神
    expect(getTenGod('甲', '丙')).toBe('食神');
    // 甲(阳木) 生 丁(阴火): diff polarity -> 伤官
    expect(getTenGod('甲', '丁')).toBe('伤官');
  });

  it('day controls target (我克): 偏财 (same polarity) / 正财 (diff)', () => {
    // 甲(阳木) 克 戊(阳土): same -> 偏财
    expect(getTenGod('甲', '戊')).toBe('偏财');
    // 甲(阳木) 克 己(阴土): diff -> 正财
    expect(getTenGod('甲', '己')).toBe('正财');
  });

  it('target generates day (生我): 偏印 (same polarity) / 正印 (diff)', () => {
    // 壬(阳水) 生 甲(阳木): same -> 偏印
    expect(getTenGod('甲', '壬')).toBe('偏印');
    // 癸(阴水) 生 甲(阳木): diff -> 正印
    expect(getTenGod('甲', '癸')).toBe('正印');
  });

  it('target controls day (克我): 七杀 (same polarity) / 正官 (diff)', () => {
    // 庚(阳金) 克 甲(阳木): same -> 七杀
    expect(getTenGod('甲', '庚')).toBe('七杀');
    // 辛(阴金) 克 甲(阳木): diff -> 正官
    expect(getTenGod('甲', '辛')).toBe('正官');
  });

  it('returns 未知 for falsy / invalid input', () => {
    expect(getTenGod('' as TianGan, '甲')).toBe('未知');
    expect(getTenGod('甲', '' as TianGan)).toBe('未知');
    expect(getTenGod('X' as TianGan, '甲')).toBe('未知');
  });

  it('never returns 未知 for any valid gan pair', () => {
    for (const a of TIANGAN_LIST) {
      for (const b of TIANGAN_LIST) {
        expect(getTenGod(a, b)).not.toBe('未知');
      }
    }
  });

  it('every valid pair maps to one of the 10 ten-god labels', () => {
    const valid = new Set([
      '比肩',
      '劫财',
      '食神',
      '伤官',
      '正财',
      '偏财',
      '正官',
      '七杀',
      '正印',
      '偏印',
    ]);
    for (const a of TIANGAN_LIST) {
      for (const b of TIANGAN_LIST) {
        expect(valid.has(getTenGod(a, b))).toBe(true);
      }
    }
  });
});

describe('getNaYin (纳音五行)', () => {
  it('returns canonical 纳音 names for known 甲子六十花甲', () => {
    expect(getNaYin('甲', '子')).toBe('海中金');
    expect(getNaYin('乙', '丑')).toBe('海中金');
    expect(getNaYin('丙', '寅')).toBe('炉中火');
    expect(getNaYin('壬', '戌')).toBe('大海水');
    expect(getNaYin('癸', '亥')).toBe('大海水');
  });

  it('returns 纳音待查 for a combination outside the 60-cycle table', () => {
    // 甲丑 is not a valid 干支 (mismatched parity) -> not in table
    expect(getNaYin('甲', '丑')).toBe('纳音待查');
  });

  it('covers all 60 valid 干支 combinations (none fall through)', () => {
    const TIANGAN: TianGan[] = [
      '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
    ];
    const DIZHI: DiZhi[] = [
      '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
    ];
    let resolved = 0;
    for (let i = 0; i < 60; i++) {
      const gan = TIANGAN[i % 10];
      const zhi = DIZHI[i % 12];
      if (getNaYin(gan, zhi) !== '纳音待查') resolved++;
    }
    expect(resolved).toBe(60);
  });
});
