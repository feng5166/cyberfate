import { describe, it, expect } from 'vitest';
import { calculateBazi } from './calculator';
import { getShenshaTargets, shenshaNature, analyzeShensha } from './shensha';
import { analyzeLiuyue } from './liunian';

const chart = calculateBazi({
  gender: 'male',
  birthDate: '1990-05-15',
  birthHourNum: 10,
  birthMinute: 30,
  knowTime: true,
}).chart;

describe('神煞吉凶分类', () => {
  it('classifies known 神煞 nature', () => {
    expect(shenshaNature('天乙贵人')).toBe('吉');
    expect(shenshaNature('国印贵人')).toBe('吉');
    expect(shenshaNature('金舆')).toBe('吉');
    expect(shenshaNature('羊刃')).toBe('凶');
    expect(shenshaNature('桃花')).toBe('中');
    expect(shenshaNature('不存在的')).toBe('中');
  });

  it('getShenshaTargets includes 国印/金舆 and dedupes by name+branch', () => {
    const targets = getShenshaTargets(chart);
    const names = new Set(targets.map(t => t.name));
    expect(names.has('国印贵人')).toBe(true);
    expect(names.has('金舆')).toBe(true);
    // 去重：同名+同地支不重复
    const keys = targets.map(t => `${t.name}|${t.branch}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('流月引动神煞', () => {
  it('flow 流月 carries shensha activation array', () => {
    const flow = analyzeLiuyue(chart, 2026, 8);
    expect(Array.isArray(flow.shensha)).toBe(true);
    flow.shensha.forEach(s => {
      expect(['流月逢', '引动']).toContain(s.type);
      expect(typeof s.name).toBe('string');
    });
  });

  it('「流月逢」命中神煞靶位与 getShenshaTargets 一致', () => {
    const targets = getShenshaTargets(chart);
    // 找一个靶位地支，构造该地支的流月，应至少出现一个「流月逢」
    for (let m = 1; m <= 12; m++) {
      const flow = analyzeLiuyue(chart, 2026, m);
      for (const s of flow.shensha) {
        if (s.type === '流月逢') {
          expect(targets.some(t => t.name === s.name && t.branch === flow.zhi)).toBe(true);
        }
      }
    }
  });

  it('natal 神煞 still computed (regression)', () => {
    expect(Array.isArray(analyzeShensha(chart))).toBe(true);
  });
});
