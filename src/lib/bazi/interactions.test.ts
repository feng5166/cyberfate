import { describe, it, expect } from 'vitest';
import { analyzeInteractions, relateBranches } from './interactions';
import { TIANGAN_WUXING, DIZHI_WUXING } from './constants';
import type { BaziChart, Pillar, TianGan, DiZhi } from './types';

function mkPillar(gan: TianGan, zhi: DiZhi): Pillar {
  return { gan, zhi, ganWuxing: TIANGAN_WUXING[gan], zhiWuxing: DIZHI_WUXING[zhi] };
}

/** 构造命盘：天干一律用甲（关系判定只看地支），地支按需指定 */
function mkChart(year: DiZhi, month: DiZhi, day: DiZhi, hour?: DiZhi): BaziChart {
  return {
    year: mkPillar('甲', year),
    month: mkPillar('甲', month),
    day: mkPillar('甲', day),
    hour: hour ? mkPillar('甲', hour) : null,
  };
}

function hasType(chart: BaziChart, type: string, branches: DiZhi[]) {
  const set = new Set(branches);
  return analyzeInteractions(chart).some(
    r => r.type === type && r.branches.length === branches.length && r.branches.every(b => set.has(b)),
  );
}

describe('relateBranches（两两关系）', () => {
  it('六冲：子午、寅申等六组', () => {
    expect(relateBranches('子', '午').some(r => r.type === '六冲')).toBe(true);
    expect(relateBranches('寅', '申').some(r => r.type === '六冲')).toBe(true);
    expect(relateBranches('辰', '戌').some(r => r.type === '六冲')).toBe(true);
  });

  it('六合：子丑化土、卯戌化火', () => {
    const ziChou = relateBranches('子', '丑').find(r => r.type === '六合');
    expect(ziChou?.huaWuxing).toBe('土');
    const maoXu = relateBranches('卯', '戌').find(r => r.type === '六合');
    expect(maoXu?.huaWuxing).toBe('火');
  });

  it('六害：子未、酉戌', () => {
    expect(relateBranches('子', '未').some(r => r.type === '六害')).toBe(true);
    expect(relateBranches('酉', '戌').some(r => r.type === '六害')).toBe(true);
  });

  it('三刑对：子卯(无礼)、寅巳(无恩)', () => {
    const ziMao = relateBranches('子', '卯').find(r => r.type === '三刑');
    expect(ziMao?.note).toContain('无礼');
    const yinSi = relateBranches('寅', '巳').find(r => r.type === '三刑');
    expect(yinSi?.note).toContain('无恩');
  });

  it('自刑：辰辰/午午/酉酉/亥亥，且仅这四支', () => {
    expect(relateBranches('辰', '辰').some(r => r.type === '自刑')).toBe(true);
    expect(relateBranches('午', '午').some(r => r.type === '自刑')).toBe(true);
    expect(relateBranches('子', '子')).toHaveLength(0);
  });

  it('无关系地支返回空数组', () => {
    expect(relateBranches('子', '寅')).toHaveLength(0);
  });

  it('对称性：relateBranches(a,b) 与 (b,a) 类型一致', () => {
    const ab = relateBranches('卯', '戌').map(r => r.type).sort();
    const ba = relateBranches('戌', '卯').map(r => r.type).sort();
    expect(ab).toEqual(ba);
  });
});

describe('analyzeInteractions（三支组合）', () => {
  it('三合局：申子辰化水', () => {
    const chart = mkChart('申', '子', '辰', '寅');
    const sanhe = analyzeInteractions(chart).find(r => r.type === '三合');
    expect(sanhe?.huaWuxing).toBe('水');
    expect(new Set(sanhe?.branches)).toEqual(new Set(['申', '子', '辰']));
  });

  it('半三合：申子（缺辰，含旺神子）化水', () => {
    const chart = mkChart('申', '子', '巳', '未');
    const half = analyzeInteractions(chart).find(r => r.type === '半三合');
    expect(half?.huaWuxing).toBe('水');
  });

  it('全三合存在时不再额外计半三合', () => {
    const chart = mkChart('申', '子', '辰', '巳');
    const results = analyzeInteractions(chart);
    expect(results.some(r => r.type === '三合')).toBe(true);
    expect(results.some(r => r.type === '半三合')).toBe(false);
  });

  it('三会方：寅卯辰会木', () => {
    const chart = mkChart('寅', '卯', '辰', '午');
    const sanhui = analyzeInteractions(chart).find(r => r.type === '三会');
    expect(sanhui?.huaWuxing).toBe('木');
  });

  it('三刑全：寅巳申（恃势/无恩之刑标注三刑全）', () => {
    const chart = mkChart('寅', '巳', '申', '子');
    const full = analyzeInteractions(chart).find(r => r.type === '三刑' && r.note?.includes('三刑全'));
    expect(full).toBeTruthy();
  });

  it('六冲在命盘层级被检出', () => {
    expect(hasType(mkChart('子', '午', '寅'), '六冲', ['子', '午'])).toBe(true);
  });

  it('无时柱（hour=null）只用三柱，不报错', () => {
    const chart = mkChart('子', '丑', '寅');
    expect(() => analyzeInteractions(chart)).not.toThrow();
    expect(analyzeInteractions(chart).some(r => r.type === '六合')).toBe(true); // 子丑合
  });
});
