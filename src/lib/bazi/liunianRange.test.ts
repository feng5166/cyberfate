import { describe, it, expect } from 'vitest';
import { calculateBazi } from './calculator';
import { analyzeLiuyueRange } from './liunian';
import { runBaziToolchain } from './tools';

const chart = calculateBazi({
  gender: 'male',
  birthDate: '1990-05-15',
  birthHourNum: 10,
  birthMinute: 30,
  knowTime: true,
}).chart;

describe('analyzeLiuyueRange', () => {
  it('returns N consecutive months with year rollover', () => {
    const months = analyzeLiuyueRange(chart, 2026, 8, 8);
    expect(months.length).toBe(8);
    // 2026-08 .. 2027-03
    expect({ y: months[0].year, m: months[0].month }).toEqual({ y: 2026, m: 8 });
    expect({ y: months[4].year, m: months[4].month }).toEqual({ y: 2026, m: 12 });
    expect({ y: months[5].year, m: months[5].month }).toEqual({ y: 2027, m: 1 });
    expect({ y: months[7].year, m: months[7].month }).toEqual({ y: 2027, m: 3 });
  });

  it('each month carries 干支 / 十神 / 刑冲 facts', () => {
    const [first] = analyzeLiuyueRange(chart, 2026, 6, 1);
    expect(first.ganzhi).toMatch(/^.{2}$/);
    expect(first.ganTenGod).toBeTruthy();
    expect(Array.isArray(first.zhiHiddenTenGods)).toBe(true);
    expect(first.label).toContain('流月');
  });
});

describe('runBaziToolchain liuyueMonths', () => {
  const input = {
    chart,
    birth: { birthDate: '1990-05-15', gender: 'male' as const, birthHourNum: 10, birthMinute: 30 },
    today: '2026-06-17',
  };

  it('default = 1 流月 step', () => {
    const steps = runBaziToolchain(input);
    expect(steps.filter(s => s.name === 'analyzeLiuyue').length).toBe(1);
  });

  it('liuyueMonths=8 flattens into 8 流月 steps', () => {
    const steps = runBaziToolchain({ ...input, liuyueMonths: 8 });
    expect(steps.filter(s => s.name === 'analyzeLiuyue').length).toBe(8);
    // 其余步骤仍在
    expect(steps.some(s => s.name === 'queryDayun')).toBe(true);
    expect(steps.some(s => s.name === 'analyzeLiunian')).toBe(true);
  });
});
