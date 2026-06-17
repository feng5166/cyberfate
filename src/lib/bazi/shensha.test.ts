import { describe, it, expect } from 'vitest';
import { analyzeShensha, type ShenshaHit } from './shensha';
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

function names(hits: ShenshaHit[]): Set<string> {
  return new Set(hits.map(h => h.name));
}

describe('analyzeShensha — 以日干起', () => {
  it('天乙贵人：甲日见丑/未', () => {
    const chart = mkChart(['丙', '丑'], ['丙', '寅'], ['甲', '辰'], ['丙', '未']);
    const hits = analyzeShensha(chart);
    const tianyi = hits.filter(h => h.name === '天乙贵人');
    expect(tianyi.length).toBe(2); // 丑、未
    expect(new Set(tianyi.map(h => h.branch))).toEqual(new Set(['丑', '未']));
  });

  it('文昌贵人：甲日见巳', () => {
    const chart = mkChart(['甲', '辰'], ['甲', '巳'], ['甲', '寅'], ['甲', '戌']);
    expect(names(analyzeShensha(chart)).has('文昌贵人')).toBe(true);
  });

  it('禄神：甲日临官在寅', () => {
    const chart = mkChart(['甲', '寅'], ['甲', '辰'], ['甲', '午'], ['甲', '戌']);
    const lu = analyzeShensha(chart).find(h => h.name === '禄神');
    expect(lu?.branch).toBe('寅');
  });

  it('羊刃：阳日干甲刃在卯；阴日干乙不带羊刃', () => {
    const yang = mkChart(['甲', '卯'], ['甲', '辰'], ['甲', '午'], ['甲', '戌']);
    expect(names(analyzeShensha(yang)).has('羊刃')).toBe(true);
    const yin = mkChart(['乙', '卯'], ['乙', '辰'], ['乙', '午'], ['乙', '戌']);
    expect(names(analyzeShensha(yin)).has('羊刃')).toBe(false);
  });
});

describe('analyzeShensha — 以三合局起', () => {
  it('桃花：年支子(申子辰局)见酉', () => {
    const chart = mkChart(['甲', '子'], ['甲', '酉'], ['甲', '寅'], ['甲', '戌']);
    const taohua = analyzeShensha(chart).find(h => h.name === '桃花');
    expect(taohua?.branch).toBe('酉');
  });

  it('驿马：年支寅(寅午戌局)见申', () => {
    const chart = mkChart(['甲', '寅'], ['甲', '申'], ['甲', '子'], ['甲', '辰']);
    const yima = analyzeShensha(chart).find(h => h.name === '驿马');
    expect(yima?.branch).toBe('申');
  });

  it('华盖：年支亥(亥卯未局)见未', () => {
    const chart = mkChart(['甲', '亥'], ['甲', '未'], ['甲', '子'], ['甲', '辰']);
    const huagai = analyzeShensha(chart).find(h => h.name === '华盖');
    expect(huagai?.branch).toBe('未');
  });
});

describe('analyzeShensha — 空亡', () => {
  it('甲子日空亡为戌、亥', () => {
    const chart = mkChart(['甲', '戌'], ['甲', '亥'], ['甲', '子'], ['甲', '寅']);
    const kong = analyzeShensha(chart).filter(h => h.name === '空亡');
    expect(new Set(kong.map(h => h.branch))).toEqual(new Set(['戌', '亥']));
  });

  it('甲戌日空亡为申、酉', () => {
    const chart = mkChart(['甲', '申'], ['甲', '酉'], ['甲', '戌'], ['甲', '子']);
    const kong = analyzeShensha(chart).filter(h => h.name === '空亡');
    expect(new Set(kong.map(h => h.branch))).toEqual(new Set(['申', '酉']));
  });
});

describe('analyzeShensha — 鲁棒性', () => {
  it('无时柱不报错', () => {
    const chart = mkChart(['甲', '子'], ['甲', '丑'], ['甲', '寅']);
    expect(() => analyzeShensha(chart)).not.toThrow();
  });

  it('去重：同名同柱同支只保留一条', () => {
    const chart = mkChart(['甲', '子'], ['甲', '丑'], ['甲', '寅'], ['甲', '卯']);
    const hits = analyzeShensha(chart);
    const keys = hits.map(h => `${h.name}|${h.branch}|${[...h.pillars].sort().join(',')}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
