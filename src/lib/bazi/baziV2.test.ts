import { describe, it, expect } from 'vitest';
import { calculateBazi } from './calculator';
import { analyzeMingGe } from './geju';
import { analyzeLiunian } from './liunian';
import { getDayunTimeline } from './calculator';
import { buildQuickRead } from './quickRead';
import { personaFor } from './persona';
import { scanYingqi } from './yingqi';
import type { GejuName } from './geju';
import type { TianGan } from './types';

const BIRTH = '1983-08-21';
const bazi = calculateBazi({ gender: 'male', birthDate: BIRTH, birthHourNum: 11, birthMinute: 15, knowTime: true });
const mingGe = analyzeMingGe(bazi.chart);
const timeline = getDayunTimeline(BIRTH, 'male', 11, 15);

describe('buildQuickRead（命盘速读）', () => {
  it('常规命盘输出 3 句，无空槽位', () => {
    const lines = buildQuickRead({
      dayGan: bazi.chart.day.gan,
      mingGe,
      dayunTimeline: timeline,
      liunian: analyzeLiunian(bazi.chart, 2026),
      currentYear: 2026,
    });
    expect(lines).toHaveLength(3);
    for (const l of lines) {
      expect(l).not.toContain('undefined');
      expect(l).not.toContain('null');
      expect(l.length).toBeGreaterThan(10);
    }
  });

  it('八字直输模式（无大运/无流年）降级为 1 句', () => {
    const lines = buildQuickRead({
      dayGan: bazi.chart.day.gan,
      mingGe,
      dayunTimeline: [],
      liunian: null,
      currentYear: 2026,
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain('undefined');
  });

  it('确定性：同输入两次一致', () => {
    const args = {
      dayGan: bazi.chart.day.gan,
      mingGe,
      dayunTimeline: timeline,
      liunian: analyzeLiunian(bazi.chart, 2026),
      currentYear: 2026,
    };
    expect(buildQuickRead(args)).toEqual(buildQuickRead(args));
  });
});

describe('personaFor（命格人设）', () => {
  const GEJUS: GejuName[] = ['正财格','偏财格','正官格','七杀格','正印格','偏印格','食神格','伤官格','建禄格','羊刃格','杂气格','从强格','从弱格','综合格'];
  const GANS: TianGan[] = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

  it('全部 14 格局 × 10 天干组合都有完整文案', () => {
    for (const g of GEJUS) {
      for (const gan of GANS) {
        const p = personaFor(g, gan);
        expect(p.title).toContain(g);
        expect(p.image.length).toBeGreaterThan(0);
        expect(p.epithet.length).toBeGreaterThan(3);
        expect(p.tagline.length).toBeGreaterThan(3);
      }
    }
  });
});

describe('scanYingqi（应期扫描）', () => {
  it('未来 10 年可扫出应期条目，字段完整且按年升序', () => {
    const items = scanYingqi(bazi.chart, 'male', 2026, 10);
    expect(items.length).toBeGreaterThan(0);
    let prev = 0;
    for (const it of items) {
      expect(it.year).toBeGreaterThanOrEqual(2026);
      expect(it.year).toBeLessThan(2036);
      expect(it.year).toBeGreaterThanOrEqual(prev);
      prev = it.year;
      expect(['婚缘', '事业', '财运', '谨慎']).toContain(it.kind);
      expect(it.reason.length).toBeGreaterThan(5);
      expect(it.ganzhi).toHaveLength(2);
    }
  });

  it('性别影响配偶星判定（男女应期不同）', () => {
    const male = scanYingqi(bazi.chart, 'male', 2026, 10);
    const female = scanYingqi(bazi.chart, 'female', 2026, 10);
    expect(JSON.stringify(male)).not.toBe(JSON.stringify(female));
  });

  it('确定性：同输入两次一致', () => {
    expect(scanYingqi(bazi.chart, 'male', 2026, 10)).toEqual(scanYingqi(bazi.chart, 'male', 2026, 10));
  });
});
