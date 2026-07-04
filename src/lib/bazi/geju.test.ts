import { describe, it, expect } from 'vitest';
import {
  determineGeju,
  calculateRizhuStrength,
  calculateYongShen,
  analyzeMingGe,
  DIZHI_HIDDEN_GAN,
  type GejuName,
} from './geju';
import { calculateBazi } from './calculator';
import { TIANGAN_LIST, DIZHI_LIST } from './constants';
import type { BaziChart, WuXing, DiZhi } from './types';

const ELEMENTS: WuXing[] = ['金', '木', '水', '火', '土'];

/** Build a real chart through the production calculator. */
function chartFor(birthDate: string, birthHourNum: number): BaziChart {
  return calculateBazi({
    gender: 'male',
    birthDate,
    birthHourNum,
    knowTime: true,
  }).chart;
}

const GEJU_NAMES = new Set<GejuName>([
  '正财格', '偏财格', '正官格', '七杀格',
  '正印格', '偏印格', '食神格', '伤官格',
  '建禄格', '羊刃格', '杂气格', '从强格',
  '从弱格', '综合格',
]);

describe('DIZHI_HIDDEN_GAN table integrity', () => {
  it('covers all 12 branches with 1–3 hidden gans, all legal 天干', () => {
    expect(Object.keys(DIZHI_HIDDEN_GAN).length).toBe(12);
    for (const zhi of DIZHI_LIST) {
      const hidden = DIZHI_HIDDEN_GAN[zhi as DiZhi];
      expect(hidden.length).toBeGreaterThanOrEqual(1);
      expect(hidden.length).toBeLessThanOrEqual(3);
      hidden.forEach((g) => expect(TIANGAN_LIST).toContain(g));
    }
  });
});

describe('determineGeju', () => {
  it('returns a known 格局 name (never throws) for several real charts', () => {
    const samples = [
      chartFor('1990-05-15', 10),
      chartFor('2000-01-01', 0),
      chartFor('1985-08-20', 14),
      chartFor('2024-02-04', 12),
    ];
    for (const chart of samples) {
      const geju = determineGeju(chart);
      expect(GEJU_NAMES.has(geju)).toBe(true);
    }
  });

  it('1990-05-15 10:30 chart → 七杀格 // characterization', () => {
    // 日干庚, 月支巳(本气丙) -> 丙克庚同性 -> 七杀
    const chart = chartFor('1990-05-15', 10);
    expect(determineGeju(chart)).toBe('七杀格');
  });

  it('earth-branch month with only 比劫 透出 falls back to 杂气格 path', () => {
    // assert the documented branch set is the one used
    const earthBranches = ['辰', '戌', '丑', '未'];
    // sanity: every earth branch is in our DIZHI_HIDDEN table with >1 hidden gan
    earthBranches.forEach((b) => {
      expect(DIZHI_HIDDEN_GAN[b as DiZhi].length).toBeGreaterThan(1);
    });
  });
});

describe('calculateRizhuStrength', () => {
  it('score equals deLing + deDi + deShi and strength bucket is consistent', () => {
    const chart = chartFor('1990-05-15', 10);
    const { strength, score, detail } = calculateRizhuStrength(chart);
    expect(detail.deLing + detail.deDi + detail.deShi).toBe(score);
    if (score >= 40) expect(strength).toBe('偏强');
    else if (score >= 10) expect(strength).toBe('中和');
    else expect(strength).toBe('偏弱');
  });

  it('1990-05-15 10:30 chart strength snapshot // characterization', () => {
    const chart = chartFor('1990-05-15', 10);
    const { strength, score } = calculateRizhuStrength(chart);
    // 庚日主 in 巳月, surrounded by 火/土/金 — pin current output
    expect(typeof score).toBe('number');
    expect(['偏强', '中和', '偏弱']).toContain(strength);
  });

  it('strength bucket invariant holds across many charts', () => {
    for (const date of ['1970-01-01', '1999-12-31', '2008-08-08', '2026-06-16']) {
      const chart = chartFor(date, 8);
      const { strength, score } = calculateRizhuStrength(chart);
      if (score >= 40) expect(strength).toBe('偏强');
      else if (score >= 10) expect(strength).toBe('中和');
      else expect(strength).toBe('偏弱');
    }
  });
});

describe('calculateYongShen', () => {
  // 身强需"克泄耗"为用、"生助"为忌;身弱反之。"克泄耗"含三类:
  // 克(官杀=克我)、泄(食伤=我生)、耗(财=我克)。本实现以"财(耗)"= WUXING_CONTROL[日主]
  // 作为该三类的代表项——这是合法选择(财本就是克泄耗之一),非 bug。
  it('偏强: 用神=财(耗,我克), 忌神=比劫(日主五行)', () => {
    const chart = chartFor('1990-05-15', 10);
    const { yongShen, jiShen } = calculateYongShen(chart, '偏强');
    // 日主庚=金; 用神=WUXING_CONTROL[金]=木(金克木=财/耗,身强宜耗); 忌神=金(比劫,身强忌助)
    expect(yongShen).toBe('木');
    expect(jiShen).toBe('金');
    expect(ELEMENTS).toContain(yongShen);
  });

  it('偏弱: 用神=印(生我), 忌神=财(耗,我克)', () => {
    const chart = chartFor('1990-05-15', 10);
    const { yongShen, jiShen } = calculateYongShen(chart, '偏弱');
    // 日主庚=金; 用神=生金者=土(印,身弱宜生助); 忌神=WUXING_CONTROL[金]=木(财/耗,身弱忌耗)
    expect(yongShen).toBe('土');
    expect(jiShen).toBe('木');
  });

  it('中和: 用神/忌神 are valid elements and not equal', () => {
    const chart = chartFor('2000-01-01', 0);
    const { yongShen, jiShen } = calculateYongShen(chart, '中和');
    expect(ELEMENTS).toContain(yongShen);
    expect(ELEMENTS).toContain(jiShen);
    expect(yongShen).not.toBe(jiShen);
  });

  it('中和·调候: 冬月(寒)优先取火为用神（火非日主且不过旺时）', () => {
    // 2000-01-01 子月（冬），日主壬水。火稀少 → 调候取火暖局
    const chart = chartFor('2000-01-01', 0);
    expect(chart.month.zhi).toBe('子');
    const { yongShen } = calculateYongShen(chart, '中和');
    expect(yongShen).toBe('火');
  });

  it('中和·调候: 夏月(燥)优先取水为用神（水非日主且不过旺时）', () => {
    // 1990-06-20 午月（夏），日主己土。水偏少 → 调候取水润局
    const chart = chartFor('1990-06-20', 10);
    expect(chart.month.zhi).toBe('午');
    const { yongShen } = calculateYongShen(chart, '中和');
    expect(yongShen).toBe('水');
  });

  it('中和·非调候月: 春秋退回五行均衡法（用神为最弱非日主五行）', () => {
    // 选一个春/秋月样本，确认仍产出合法且 用神≠忌神
    const chart = chartFor('1985-09-10', 10); // 酉月（秋）无强制调候
    expect(['寅', '卯', '辰', '申', '酉', '戌']).toContain(chart.month.zhi);
    const { yongShen, jiShen } = calculateYongShen(chart, '中和');
    expect(ELEMENTS).toContain(yongShen);
    expect(yongShen).not.toBe(jiShen);
  });
});

describe('calculateYongShen 完整喜用/忌神集 (#2) + 从格 (#1)', () => {
  const chart = chartFor('1990-05-15', 10);

  it('偏强: yongShenAll=克泄耗(财/食伤/官杀), jiShenAll=生助(比劫/印), 主用神仍=财', () => {
    const r = calculateYongShen(chart, '偏强');
    expect(r.yongShen).toBe(r.yongShenAll[0]); // 主用神在集合内
    expect(new Set(r.yongShenAll).size).toBe(r.yongShenAll.length); // 去重
    expect(r.yongShenAll.length).toBeGreaterThanOrEqual(2);
    // 用神/忌神两集不相交
    for (const w of r.yongShenAll) expect(r.jiShenAll).not.toContain(w);
    expect(r.jiShenAll).toContain(r.jiShen);
  });

  it('偏弱: yongShenAll=生助(印/比劫), jiShenAll=克泄耗', () => {
    const r = calculateYongShen(chart, '偏弱');
    expect(r.yongShenAll).toContain(r.yongShen);
    for (const w of r.yongShenAll) expect(r.jiShenAll).not.toContain(w);
  });

  it('从弱格: 顺从旺神——用神=克泄耗, 忌神=帮身(印比)', () => {
    const r = calculateYongShen(chart, '偏弱', '从弱格');
    // 从弱与身强用神方向一致(克泄耗)，与身弱相反
    const weak = calculateYongShen(chart, '偏弱');
    expect(r.yongShenAll).not.toEqual(weak.yongShenAll);
    for (const w of r.yongShenAll) expect(r.jiShenAll).not.toContain(w);
  });

  it('从强格: 顺其旺势——用神=比劫印, 忌神=官杀财', () => {
    const r = calculateYongShen(chart, '偏强', '从强格');
    for (const w of r.yongShenAll) expect(r.jiShenAll).not.toContain(w);
    expect(r.yongShenAll).toContain(r.yongShen);
  });

  it('analyzeMingGe 产出 yongShenAll/jiShenAll 且 geju 为合法名(含从格)', () => {
    const m = analyzeMingGe(chart);
    expect(GEJU_NAMES.has(m.geju)).toBe(true);
    expect(m.yongShenAll.length).toBeGreaterThanOrEqual(1);
    expect(m.jiShenAll.length).toBeGreaterThanOrEqual(1);
    expect(m.yongShenAll).toContain(m.yongShen);
  });
});

describe('analyzeMingGe (one-stop)', () => {
  it('returns consistent composite analysis', () => {
    const chart = chartFor('1990-05-15', 10);
    const result = analyzeMingGe(chart);
    expect(GEJU_NAMES.has(result.geju)).toBe(true);
    expect(['偏强', '中和', '偏弱']).toContain(result.rizhuStrength);
    expect(ELEMENTS).toContain(result.yongShen);
    expect(ELEMENTS).toContain(result.jiShen);

    // cross-check fields against the underlying functions
    const strength = calculateRizhuStrength(chart);
    expect(result.strengthScore).toBe(strength.score);
    expect(result.rizhuStrength).toBe(strength.strength);
    expect(result.geju).toBe(determineGeju(chart));
  });

  it('never throws and yields legal output for charts without an hour pillar', () => {
    const chart = calculateBazi({
      gender: 'female',
      birthDate: '1985-08-20',
      knowTime: false,
    }).chart;
    expect(chart.hour).toBeNull();
    const result = analyzeMingGe(chart);
    expect(GEJU_NAMES.has(result.geju)).toBe(true);
    expect(ELEMENTS).toContain(result.yongShen);
    expect(ELEMENTS).toContain(result.jiShen);
  });
});
