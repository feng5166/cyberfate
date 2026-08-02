// 紫微 V2 引擎测试（PRD-ZIWEI-V2）：大限 / 流年 / 速读 / 四化叙事
import { describe, it, expect } from 'vitest';
import { calculateZiwei } from './calculator';
import {
  calcZiweiDayun,
  calcZiweiLiunian,
  calcNatalSihua,
  juNumberFromName,
  yearGanZhiOf,
  isYangGan,
} from './dayun';
import { buildZiweiQuickRead, buildSihuaNarrative, describeLifePalace } from './quickRead';
import type { TianGan } from './types';

const CHART = calculateZiwei({ birthDate: '1990-06-15', birthHour: 3, gender: 'male' });
const YEAR_GAN = CHART.debug.yearGanZhi[0] as TianGan; // 庚午年 → 庚
const JU = juNumberFromName(CHART.wuxingJu)!;

describe('juNumberFromName / yearGanZhiOf / isYangGan', () => {
  it('五行局名转局数', () => {
    expect(juNumberFromName('水二局')).toBe(2);
    expect(juNumberFromName('火六局')).toBe(6);
    expect(juNumberFromName('不存在')).toBeNull();
  });

  it('公历年干支（1984 甲子 / 2026 丙午）', () => {
    expect(yearGanZhiOf(1984)).toEqual({ gan: '甲', zhi: '子' });
    expect(yearGanZhiOf(2026)).toEqual({ gan: '丙', zhi: '午' });
  });

  it('天干阴阳', () => {
    expect(isYangGan('甲')).toBe(true);
    expect(isYangGan('庚')).toBe(true);
    expect(isYangGan('乙')).toBe(false);
  });
});

describe('calcZiweiDayun', () => {
  const dayun = calcZiweiDayun(CHART.palaces, {
    yearGan: YEAR_GAN,
    gender: 'male',
    birthYear: 1990,
    juNumber: JU,
    currentYear: 2026,
  });

  it('输出 12 限，首限从命宫起、起限虚岁 = 局数', () => {
    expect(dayun).toHaveLength(12);
    expect(dayun[0].palaceName).toBe('命宫');
    expect(dayun[0].ageStart).toBe(JU);
    expect(dayun[0].ageEnd).toBe(JU + 9);
  });

  it('庚年（阳干）男 → 顺行，第二限入父母宫', () => {
    expect(isYangGan(YEAR_GAN)).toBe(true);
    expect(dayun[1].palaceName).toBe('父母');
  });

  it('阴男逆行，第二限入兄弟宫', () => {
    const chart2 = calculateZiwei({ birthDate: '1991-06-15', birthHour: 3, gender: 'male' }); // 辛未年（阴干）
    const gan2 = chart2.debug.yearGanZhi[0] as TianGan;
    expect(isYangGan(gan2)).toBe(false);
    const d2 = calcZiweiDayun(chart2.palaces, {
      yearGan: gan2, gender: 'male', birthYear: 1991,
      juNumber: juNumberFromName(chart2.wuxingJu)!, currentYear: 2026,
    });
    expect(d2[1].palaceName).toBe('兄弟');
  });

  it('恰好一个当前大限，且年份区间衔接无缝', () => {
    expect(dayun.filter((d) => d.isCurrent)).toHaveLength(1);
    for (let i = 1; i < dayun.length; i++) {
      expect(dayun[i].yearStart).toBe(dayun[i - 1].yearEnd + 1);
    }
  });

  it('虚岁→公历年换算：yearStart = 出生年 + 起限虚岁 - 1', () => {
    expect(dayun[0].yearStart).toBe(1990 + JU - 1);
  });
});

describe('calcZiweiLiunian / calcNatalSihua', () => {
  it('流年命宫地支 = 当年地支，四化四条且星名匹配四化表', () => {
    const ln = calcZiweiLiunian(CHART.palaces, 2026)!;
    expect(ln.ganZhi).toBe('丙午');
    expect(ln.palaceBranch).toBe('午');
    expect(ln.sihua).toHaveLength(4);
    // 丙年：天同化禄 / 天机化权 / 文昌化科 / 廉贞化忌
    expect(ln.sihua.find((s) => s.type === '化禄')?.star).toBe('天同');
    expect(ln.sihua.find((s) => s.type === '化忌')?.star).toBe('廉贞');
  });

  it('主星四化必有落宫（14 主星总在盘面上）', () => {
    const natal = calcNatalSihua(CHART.palaces, YEAR_GAN);
    // 庚年：太阳化禄 / 武曲化权 / 太阴化科 / 天同化忌 —— 全为主星，落宫不为 null
    for (const s of natal) {
      expect(s.palaceName).not.toBeNull();
    }
  });
});

describe('buildZiweiQuickRead / describeLifePalace', () => {
  it('速读三句话齐全且不含空槽', () => {
    const dayun = calcZiweiDayun(CHART.palaces, {
      yearGan: YEAR_GAN, gender: 'male', birthYear: 1990, juNumber: JU, currentYear: 2026,
    });
    const lines = buildZiweiQuickRead({
      palaces: CHART.palaces,
      mingzhu: CHART.mingzhu,
      shenzhu: CHART.shenzhu,
      wuxingJu: CHART.wuxingJu,
      dayunList: dayun,
    });
    expect(lines.length).toBeGreaterThanOrEqual(2);
    for (const line of lines) {
      expect(line).not.toMatch(/undefined|null|NaN/);
      expect(line.length).toBeGreaterThan(8);
    }
  });

  it('命宫定性不空、不出模板变量', () => {
    const text = describeLifePalace(CHART.palaces);
    expect(text).not.toMatch(/undefined|\{|\}/);
    expect(text.length).toBeGreaterThan(10);
  });

  it('大限缺失时降级为两句，不抛错', () => {
    const lines = buildZiweiQuickRead({
      palaces: CHART.palaces,
      mingzhu: CHART.mingzhu,
      shenzhu: CHART.shenzhu,
      wuxingJu: CHART.wuxingJu,
      dayunList: [],
    });
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });
});

describe('buildSihuaNarrative', () => {
  it('四条叙事齐全，化忌走「功课」框架、无凶祸词', () => {
    const items = buildSihuaNarrative(CHART.palaces, YEAR_GAN);
    expect(items).toHaveLength(4);
    const ji = items.find((i) => i.type === '化忌')!;
    expect(ji.text).toContain('功课');
    for (const item of items) {
      expect(item.text).not.toMatch(/灾|凶|死|病痛|破败/);
      expect(item.text).not.toMatch(/undefined|null/);
    }
  });
});
