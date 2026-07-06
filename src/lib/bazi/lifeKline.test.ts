import { describe, it, expect } from 'vitest';
import { computeLifeKline, levelFromScore } from './lifeKline';
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
