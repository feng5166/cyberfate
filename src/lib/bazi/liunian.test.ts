import { describe, it, expect } from 'vitest';
import { analyzeLiunian, analyzeLiuyue } from './liunian';
import { TIANGAN_WUXING, DIZHI_WUXING } from './constants';
import type { BaziChart, Pillar, TianGan, DiZhi } from './types';

function mkPillar(gan: TianGan, zhi: DiZhi): Pillar {
  return { gan, zhi, ganWuxing: TIANGAN_WUXING[gan], zhiWuxing: DIZHI_WUXING[zhi] };
}

function mkChart(
  y: [TianGan, DiZhi],
  m: [TianGan, DiZhi],
  d: [TianGan, DiZhi],
  h?: [TianGan, DiZhi],
): BaziChart {
  return {
    year: mkPillar(...y),
    month: mkPillar(...m),
    day: mkPillar(...d),
    hour: h ? mkPillar(...h) : null,
  };
}

describe('analyzeLiunian', () => {
  it('2026 流年干支为丙午', () => {
    const chart = mkChart(['甲', '子'], ['甲', '寅'], ['甲', '辰']);
    expect(analyzeLiunian(chart, 2026).ganzhi).toBe('丙午');
  });

  it('日主甲，流年天干丙 → 食神', () => {
    const chart = mkChart(['甲', '子'], ['甲', '寅'], ['甲', '辰']);
    expect(analyzeLiunian(chart, 2026).ganTenGod).toBe('食神');
  });

  it('流年地支午冲命局子（年支）', () => {
    const chart = mkChart(['甲', '子'], ['甲', '寅'], ['甲', '辰']);
    const res = analyzeLiunian(chart, 2026);
    const ziRel = res.interactions.find(it => it.with === '子' && it.pillar === 'year');
    expect(ziRel?.relations.some(r => r.type === '六冲')).toBe(true);
  });

  it('地支午藏干十神（本气丁、中气己）非空', () => {
    const chart = mkChart(['甲', '子'], ['甲', '寅'], ['甲', '辰']);
    const res = analyzeLiunian(chart, 2026);
    expect(res.zhiHiddenTenGods.length).toBeGreaterThanOrEqual(1);
    expect(res.zhiHiddenTenGods[0].gan).toBe('丁');
  });

  it('label 含流年标识与干支', () => {
    const chart = mkChart(['甲', '子'], ['甲', '寅'], ['甲', '辰']);
    expect(analyzeLiunian(chart, 2026).label).toContain('2026年流年丙午');
  });
});

describe('analyzeLiuyue', () => {
  it('返回合法两字干支', () => {
    const chart = mkChart(['甲', '子'], ['甲', '寅'], ['甲', '辰']);
    const res = analyzeLiuyue(chart, 2026, 6);
    expect(res.ganzhi).toHaveLength(2);
    expect(res.label).toContain('流月');
  });

  it('十二个月均能算出十神（不抛错）', () => {
    const chart = mkChart(['甲', '子'], ['甲', '寅'], ['甲', '辰']);
    for (let m = 1; m <= 12; m++) {
      const res = analyzeLiuyue(chart, 2026, m);
      expect(res.ganTenGod).not.toBe('未知');
    }
  });
});
