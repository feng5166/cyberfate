import { describe, it, expect } from 'vitest';
import { runBaziToolchain, toolchainToPromptFacts } from './tools';
import { calculateBazi } from './calculator';

const chart = calculateBazi({
  gender: 'male',
  birthDate: '1995-08-15',
  birthHourNum: 10,
  knowTime: true,
}).chart;

const input = {
  chart,
  birth: { birthDate: '1995-08-15', gender: 'male' as const, birthHourNum: 10 },
  today: '2026-06-18',
};

describe('runBaziToolchain', () => {
  it('返回 8 个有序步骤', () => {
    const steps = runBaziToolchain(input);
    expect(steps).toHaveLength(8);
    expect(steps.map(s => s.name)).toEqual([
      'queryDate',
      'analyzeTenGods',
      'analyzeMingGe',
      'analyzeInteractions',
      'queryShensha',
      'queryDayun',
      'analyzeLiunian',
      'analyzeLiuyue',
    ]);
  });

  it('每步都有非空 label 与 data', () => {
    for (const step of runBaziToolchain(input)) {
      expect(step.label.length).toBeGreaterThan(0);
      expect(step.data).toBeTruthy();
      expect(JSON.stringify(step.data)).not.toContain('"error"');
    }
  });

  it('queryDate 含今日干支与农历', () => {
    const step = runBaziToolchain(input)[0];
    expect((step.data as any).dayGanzhi).toHaveLength(2);
    expect((step.data as any).lunar).toContain('年');
  });

  it('analyzeLiunian 步骤为 2026 流年丙午', () => {
    const step = runBaziToolchain(input).find(s => s.name === 'analyzeLiunian')!;
    expect((step.data as any).flow.ganzhi).toBe('丙午');
  });

  it('toolchainToPromptFacts 输出 8 行编号事实', () => {
    const facts = toolchainToPromptFacts(runBaziToolchain(input));
    expect(facts.split('\n')).toHaveLength(8);
    expect(facts).toContain('1. ');
  });

  it('analyzeMingGe 步骤含格局/强弱/用忌', () => {
    const step = runBaziToolchain(input).find(s => s.name === 'analyzeMingGe')!;
    expect(step.label).toMatch(/命格：.+，日主(偏强|中和|偏弱)/);
    expect((step.data as any).mingGe.rizhuStrength).toBeTruthy();
  });

  it('无时柱命盘也能跑完（不抛错）', () => {
    const noHour = calculateBazi({ gender: 'female', birthDate: '1990-03-20', knowTime: false }).chart;
    const steps = runBaziToolchain({
      chart: noHour,
      birth: { birthDate: '1990-03-20', gender: 'female' },
      today: '2026-06-18',
    });
    expect(steps).toHaveLength(8);
  });
});
