import { describe, it, expect } from 'vitest';
import { buildNarrative, computeLifeKline, computeLiuyueKline, levelFromScore, selectBacktestYears } from './lifeKline';
import { adviceForYear } from './adviceTemplates';
import type { BaziInput } from './types';

const SAMPLE: BaziInput = {
  gender: 'male',
  birthDate: '1983-08-21',
  birthHourNum: 11,
  birthMinute: 15,
  knowTime: true,
};

describe('computeLifeKline', () => {
  const result = computeLifeKline(SAMPLE, { currentYear: 2026 });

  it('覆盖虚岁 1-100 共 100 个年度点', () => {
    expect(result.points).toHaveLength(100);
    expect(result.points[0].age).toBe(1);
    expect(result.points[0].year).toBe(1983);
    expect(result.points[99].age).toBe(100);
    expect(result.points[99].year).toBe(2082);
  });

  it('OHLC 数值合法：high ≥ max(open,close)，low ≤ min(open,close)，均在 0-100', () => {
    for (const p of result.points) {
      expect(p.high).toBeGreaterThanOrEqual(Math.max(p.open, p.close));
      expect(p.low).toBeLessThanOrEqual(Math.min(p.open, p.close));
      expect(p.low).toBeGreaterThanOrEqual(0);
      expect(p.high).toBeLessThanOrEqual(100);
    }
  });

  it('完全确定性：同一输入两次计算结果一致', () => {
    const again = computeLifeKline(SAMPLE, { currentYear: 2026 });
    expect(again).toEqual(result);
  });

  it('不同出生信息得到不同K线', () => {
    const other = computeLifeKline({ ...SAMPLE, birthDate: '1990-03-05' }, { currentYear: 2026 });
    const a = result.points.map((p) => p.close).join(',');
    const b = other.points.map((p) => p.close).join(',');
    expect(a).not.toBe(b);
  });

  it('MA10 从第 10 年起有值，且等于前 10 年收盘均值', () => {
    for (let i = 0; i < 9; i++) expect(result.points[i].ma10).toBeNull();
    const p10 = result.points[9];
    const avg = result.points.slice(0, 10).reduce((s, p) => s + p.close, 0) / 10;
    expect(p10.ma10).toBeCloseTo(avg, 1);
  });

  it('流年干支正确（2026 = 丙午）', () => {
    const y2026 = result.points.find((p) => p.year === 2026);
    expect(y2026?.ganzhi).toBe('丙午');
  });

  it('当前年龄按虚岁计算（1983 年生，2026 年 = 44 岁）', () => {
    expect(result.summary.currentAge).toBe(44);
    expect(result.summary.currentYear).toBe(2026);
  });

  it('换大运之年被标记，且大运序号随年龄推进', () => {
    const starts = result.points.filter((p) => p.isDayunStart);
    expect(starts.length).toBeGreaterThanOrEqual(8);
    const indices = result.points.map((p) => p.dayunIndex);
    // 童限期（-1）在最前，之后单调不减
    const afterChildhood = indices.filter((i) => i >= 0);
    expect([...afterChildhood].sort((a, b) => a - b)).toEqual(afterChildhood);
  });

  it('概览统计自洽：巅峰=最高收盘，低谷=最低收盘，最佳十年均分 ≥ 最差十年', () => {
    const closes = result.points.map((p) => p.close);
    expect(result.summary.peak.score).toBe(Math.max(...closes));
    expect(result.summary.trough.score).toBe(Math.min(...closes));
    expect(result.summary.bestDecade.avg).toBeGreaterThanOrEqual(result.summary.worstDecade.avg);
  });

  it('meta 携带四柱/日主/格局/起运信息', () => {
    expect(result.meta.fourPillars.split(' ')).toHaveLength(4);
    expect(result.meta.dayMaster).toMatch(/^[甲乙丙丁戊己庚辛壬癸][金木水火土]$/);
    expect(result.meta.dayunStart).toContain('起运');
    expect(result.meta.birthYear).toBe(1983);
  });

  it('每个年度点都有等级与短评', () => {
    for (const p of result.points) {
      expect(['极盛', '上佳', '平稳', '承压', '低谷']).toContain(p.level);
      expect(p.comment.length).toBeGreaterThan(0);
    }
  });

  it('未提供时辰也能计算（knowTime=false）', () => {
    const noHour = computeLifeKline(
      { gender: 'female', birthDate: '1995-06-15', knowTime: false },
      { currentYear: 2026 },
    );
    expect(noHour.points).toHaveLength(100);
    expect(noHour.meta.fourPillars.split(' ')).toHaveLength(3);
  });

  it('农历输入正确转换出生年', () => {
    // 农历 1983-12-20 ≈ 公历 1984-01
    const lunar = computeLifeKline(
      { gender: 'male', birthDate: '1983-12-20', isLunar: true, knowTime: false },
      { currentYear: 2026 },
    );
    expect(lunar.meta.birthYear).toBe(1984);
  });
});

describe('levelFromScore', () => {
  it('分档边界正确', () => {
    expect(levelFromScore(90)).toBe('极盛');
    expect(levelFromScore(85)).toBe('极盛');
    expect(levelFromScore(80)).toBe('上佳');
    expect(levelFromScore(72)).toBe('上佳');
    expect(levelFromScore(60)).toBe('平稳');
    expect(levelFromScore(50)).toBe('承压');
    expect(levelFromScore(40)).toBe('低谷');
  });
});

describe('selectBacktestYears', () => {
  it('虚岁 ≥20：返回过去区间内的高分年与低分年，且两年拉开距离', () => {
    const result = computeLifeKline(SAMPLE, { currentYear: 2026 }); // 1983 年生，虚岁 44
    const pick = selectBacktestYears(result);
    expect(pick).not.toBeNull();
    const { peak, trough } = pick!;
    const currentAge = result.summary.currentAge!;
    for (const p of [peak, trough]) {
      expect(p.age).toBeGreaterThanOrEqual(18);
      expect(p.age).toBeLessThanOrEqual(currentAge - 1);
    }
    expect(peak.close).toBeGreaterThan(trough.close);
    // 区间内没有比 peak 更高的年份
    const past = result.points.filter((p) => p.age >= 18 && p.age <= currentAge - 1);
    expect(Math.max(...past.map((p) => p.close))).toBe(peak.close);
  });

  it('相邻极值年时低分年取次低，保证间隔 >2 年（或退化为绝对最低）', () => {
    const result = computeLifeKline(SAMPLE, { currentYear: 2026 });
    const pick = selectBacktestYears(result)!;
    const currentAge = result.summary.currentAge!;
    const past = result.points.filter((p) => p.age >= 18 && p.age <= currentAge - 1);
    const absoluteLow = Math.min(...past.map((p) => p.close));
    const gapOk = Math.abs(pick.trough.year - pick.peak.year) > 2;
    expect(gapOk || pick.trough.close === absoluteLow).toBe(true);
  });

  it('虚岁 <20 不出回测（可回忆区间太短）', () => {
    const young = computeLifeKline(
      { gender: 'female', birthDate: '2010-05-01', knowTime: false },
      { currentYear: 2026 },
    );
    expect(selectBacktestYears(young)).toBeNull();
  });

  it('当前年超出百年跨度（currentAge=null）不出回测', () => {
    const result = computeLifeKline(SAMPLE, { currentYear: 2100 });
    expect(result.summary.currentAge).toBeNull();
    expect(selectBacktestYears(result)).toBeNull();
  });

  it('确定性：同一命盘两次选择结果一致', () => {
    const a = selectBacktestYears(computeLifeKline(SAMPLE, { currentYear: 2026 }))!;
    const b = selectBacktestYears(computeLifeKline(SAMPLE, { currentYear: 2026 }))!;
    expect(a.peak.year).toBe(b.peak.year);
    expect(a.trough.year).toBe(b.trough.year);
  });
});

describe('分维度K线（dims）', () => {
  const result = computeLifeKline(SAMPLE, { currentYear: 2026 });

  it('每个年度点都带四维收盘分，且在 0-100 内', () => {
    for (const p of result.points) {
      expect(p.dims).toBeDefined();
      for (const k of ['wealth', 'career', 'love', 'health'] as const) {
        expect(p.dims![k]).toBeGreaterThanOrEqual(0);
        expect(p.dims![k]).toBeLessThanOrEqual(100);
      }
    }
  });

  it('分维度确定性：两次计算一致，且与总运方向不背离（相关性为正）', () => {
    const again = computeLifeKline(SAMPLE, { currentYear: 2026 });
    expect(again.points.map((p) => p.dims)).toEqual(result.points.map((p) => p.dims));
    // 粗守恒：四维均值与总运收盘的皮尔逊相关应为正
    const closes = result.points.map((p) => p.close);
    const dimAvg = result.points.map(
      (p) => (p.dims!.wealth + p.dims!.career + p.dims!.love + p.dims!.health) / 4,
    );
    const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
    const mc = mean(closes);
    const md = mean(dimAvg);
    const cov = closes.reduce((s, c, i) => s + (c - mc) * (dimAvg[i] - md), 0);
    expect(cov).toBeGreaterThan(0);
  });

  it('性别影响感情线（配偶星不同）', () => {
    const male = computeLifeKline(SAMPLE, { currentYear: 2026 });
    const female = computeLifeKline({ ...SAMPLE, gender: 'female' }, { currentYear: 2026 });
    const loveA = male.points.map((p) => p.dims!.love).join(',');
    const loveB = female.points.map((p) => p.dims!.love).join(',');
    expect(loveA).not.toBe(loveB);
  });
});

describe('影线归真（bestMonth/worstMonth）', () => {
  const result = computeLifeKline(SAMPLE, { currentYear: 2026 });

  it('每年标注最佳/最差流月（1-12），干支为两字', () => {
    for (const p of result.points) {
      expect(p.bestMonth.month).toBeGreaterThanOrEqual(1);
      expect(p.bestMonth.month).toBeLessThanOrEqual(12);
      expect(p.worstMonth.month).toBeGreaterThanOrEqual(1);
      expect(p.worstMonth.month).toBeLessThanOrEqual(12);
      expect(p.bestMonth.ganzhi).toHaveLength(2);
      expect(p.worstMonth.ganzhi).toHaveLength(2);
    }
  });
});

describe('computeLiuyueKline（流月下钻）', () => {
  it('返回 12 根月K线，OHLC 合法且确定性', () => {
    const a = computeLiuyueKline(SAMPLE, 2026, { currentYear: 2026 });
    const b = computeLiuyueKline(SAMPLE, 2026, { currentYear: 2026 });
    expect(a).not.toBeNull();
    expect(a!.points).toHaveLength(12);
    expect(a).toEqual(b);
    for (const m of a!.points) {
      expect(m.high).toBeGreaterThanOrEqual(Math.max(m.open, m.close));
      expect(m.low).toBeLessThanOrEqual(Math.min(m.open, m.close));
      expect(m.comment.length).toBeGreaterThan(0);
    }
  });

  it('跨度外年份返回 null', () => {
    expect(computeLiuyueKline(SAMPLE, 1900, { currentYear: 2026 })).toBeNull();
    expect(computeLiuyueKline(SAMPLE, 2120, { currentYear: 2026 })).toBeNull();
  });
});

describe('buildNarrative（叙事段）', () => {
  it('常规命盘输出 3-4 句，无空槽位', () => {
    const narrative = buildNarrative(computeLifeKline(SAMPLE, { currentYear: 2026 }));
    expect(narrative.length).toBeGreaterThanOrEqual(3);
    expect(narrative.length).toBeLessThanOrEqual(4);
    for (const s of narrative) {
      expect(s).not.toContain('undefined');
      expect(s).not.toContain('null');
      expect(s).not.toContain('NaN');
    }
  });

  it('低龄命盘（过去区间不足）降级不报错', () => {
    const young = computeLifeKline(
      { gender: 'female', birthDate: '2015-05-01', knowTime: false },
      { currentYear: 2026 },
    );
    const narrative = buildNarrative(young);
    expect(narrative.length).toBeGreaterThanOrEqual(2);
    for (const s of narrative) expect(s).not.toContain('undefined');
  });

  it('当前年超出跨度输出概览两句', () => {
    const n = buildNarrative(computeLifeKline(SAMPLE, { currentYear: 2100 }));
    expect(n).toHaveLength(2);
  });
});

describe('adviceForYear（宜忌模板）', () => {
  it('高低分年各返回 1-2 条宜/忌，确定性', () => {
    for (const level of ['极盛', '上佳', '平稳', '承压', '低谷'] as const) {
      const advice = adviceForYear({ level, yongShen: '木', jiShen: '金', tenGod: '七杀' });
      expect(advice.yi.length).toBeGreaterThanOrEqual(1);
      expect(advice.yi.length).toBeLessThanOrEqual(2);
      expect(advice.ji.length).toBeGreaterThanOrEqual(1);
      expect(advice.ji.length).toBeLessThanOrEqual(2);
    }
  });
});
