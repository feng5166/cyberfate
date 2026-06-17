import { describe, it, expect } from 'vitest';
import type { BaziChart, Pillar, TianGan, DiZhi, WuXing } from '@/lib/bazi/types';
import { getTenGod } from '@/lib/bazi/helpers';
import { DIZHI_HIDDEN_GAN } from '@/lib/bazi/geju';
import {
  SHISHEN_NAMES,
  SHISHEN_INFO,
  PILLAR_STAGE,
  calcSideShishen,
  buildShishenSummary,
} from './shishen';

// minimal Pillar factory (zhiWuxing is unused by shishen logic but required by type)
function pillar(gan: TianGan, zhi: DiZhi): Pillar {
  return { gan, zhi, ganWuxing: '木' as WuXing, zhiWuxing: '木' as WuXing };
}

// A deterministic chart with day master 甲 (木, 阳).
function makeChart(): BaziChart {
  return {
    year: pillar('庚', '申'), // 庚 vs 甲 → 七杀 (金克木, 同阳)
    month: pillar('辛', '酉'), // 辛 vs 甲 → 正官 (金克木, 异性)
    day: pillar('甲', '子'), // 日主 甲
    hour: pillar('丙', '寅'), // 丙 vs 甲 → 食神 (木生火, 同阳)
  };
}

describe('marriage/shishen — constants & metadata', () => {
  it('SHISHEN_NAMES lists the 10 canonical 十神', () => {
    expect(SHISHEN_NAMES).toHaveLength(10);
    expect(SHISHEN_NAMES).toContain('正官');
    expect(SHISHEN_NAMES).toContain('七杀');
    // 日主/未知 are bookkeeping, not part of the 10
    expect(SHISHEN_NAMES).not.toContain('日主');
  });

  it('every 十神 name has represent+trait info', () => {
    for (const name of SHISHEN_NAMES) {
      expect(SHISHEN_INFO[name].represent).toBeTruthy();
      expect(SHISHEN_INFO[name].trait).toBeTruthy();
    }
  });

  it('PILLAR_STAGE labels all four pillars', () => {
    expect(PILLAR_STAGE.year.label).toBe('年柱');
    expect(PILLAR_STAGE.hour.label).toBe('时柱');
    (['year', 'month', 'day', 'hour'] as const).forEach((k) =>
      expect(PILLAR_STAGE[k].stage).toBeTruthy(),
    );
  });
});

describe('marriage/shishen — calcSideShishen', () => {
  it('computes ganGod for each pillar via getTenGod against day master', () => {
    const side = calcSideShishen(makeChart());
    const dayGan: TianGan = '甲';

    expect(side.year!.ganGod).toBe(getTenGod(dayGan, '庚'));
    expect(side.month!.ganGod).toBe(getTenGod(dayGan, '辛'));
    expect(side.hour!.ganGod).toBe(getTenGod(dayGan, '丙'));

    // golden 十神 relationships for 甲 day master
    expect(side.year!.ganGod).toBe('七杀');
    expect(side.month!.ganGod).toBe('正官');
    expect(side.hour!.ganGod).toBe('食神');
  });

  it('attaches matching represent/trait for the pillar god', () => {
    const side = calcSideShishen(makeChart());
    expect(side.year!.ganRepresent).toBe(SHISHEN_INFO[side.year!.ganGod].represent);
    expect(side.month!.ganTrait).toBe(SHISHEN_INFO[side.month!.ganGod].trait);
  });

  it('builds hidden-gan items whose count matches DIZHI_HIDDEN_GAN', () => {
    const side = calcSideShishen(makeChart());
    // year zhi 申 hides 庚壬戊 (3) → ratios 60/25/15, positions main/middle/rest
    expect(side.year!.hidden).toHaveLength(DIZHI_HIDDEN_GAN['申'].length);
    expect(side.year!.hidden.map((h) => h.gan)).toEqual(DIZHI_HIDDEN_GAN['申']);
    expect(side.year!.hidden.map((h) => h.ratio)).toEqual([60, 25, 15]);
    expect(side.year!.hidden.map((h) => h.position)).toEqual(['main', 'middle', 'rest']);

    // day zhi 子 hides 癸 only (1) → ratio 100, position main
    expect(side.day!.hidden).toHaveLength(1);
    expect(side.day!.hidden[0].ratio).toBe(100);
    expect(side.day!.hidden[0].position).toBe('main');
  });

  it('hidden god matches getTenGod(dayGan, hiddenGan)', () => {
    const side = calcSideShishen(makeChart());
    side.year!.hidden.forEach((h) => {
      expect(h.god).toBe(getTenGod('甲', h.gan));
    });
  });

  it('returns null for a missing (null) hour pillar', () => {
    const chart = makeChart();
    chart.hour = null;
    const side = calcSideShishen(chart);
    expect(side.hour).toBeNull();
    expect(side.day).not.toBeNull();
  });
});

describe('marriage/shishen — buildShishenSummary', () => {
  it('counts 十神 occurrences across gan + hidden, excluding 日主/未知', () => {
    const side = calcSideShishen(makeChart());
    const summary = buildShishenSummary(side);

    // counts must be positive integers
    Object.values(summary.counts).forEach((c) => expect(c).toBeGreaterThan(0));
    expect(summary.counts['日主']).toBeUndefined();
    expect(summary.counts['未知']).toBeUndefined();

    // total counted == total non-日主/未知 gods across all gan + hidden
    const manual = new Map<string, number>();
    (['year', 'month', 'day', 'hour'] as const).forEach((k) => {
      const p = side[k];
      if (!p) return;
      const gods = [p.ganGod, ...p.hidden.map((h) => h.god)];
      gods.forEach((g) => {
        if (g !== '日主' && g !== '未知') manual.set(g, (manual.get(g) || 0) + 1);
      });
    });
    const manualTotal = [...manual.values()].reduce((a, b) => a + b, 0);
    const countedTotal = Object.values(summary.counts).reduce((a, b) => a + b, 0);
    expect(countedTotal).toBe(manualTotal);
  });

  it('summary text names the dominant 十神 when counts exist', () => {
    const summary = buildShishenSummary(calcSideShishen(makeChart()));
    expect(summary.text).toContain('主导十神');
    expect(summary.text.length).toBeGreaterThan(10);
  });

  it('returns the平和 fallback text when there are no countable gods', () => {
    // empty side → no counts
    const emptySide = {
      year: null,
      month: null,
      day: null,
      hour: null,
    };
    const summary = buildShishenSummary(emptySide);
    expect(summary.counts).toEqual({});
    expect(summary.text).toBe('十神分布平和，命局结构稳健。');
  });
});
