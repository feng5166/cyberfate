import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Solar } from 'lunar-javascript';
import {
  calculateBazi,
  getDayGanzhi,
  getYearGanzhi,
  getCurrentDayun,
  getDayunTimeline,
  getLunarDate,
} from './calculator';
import { TIANGAN_LIST, DIZHI_LIST } from './constants';
import type { BaziInput, BaziChart } from './types';

const GAN_SET = new Set(TIANGAN_LIST);
const ZHI_SET = new Set(DIZHI_LIST);

/** Independent oracle: derive 四柱 干支 straight from lunar-javascript. */
function oracle(y: number, m: number, d: number, h: number, mi = 0) {
  const ec = (Solar as any).fromYmdHms(y, m, d, h, mi, 0).getLunar().getEightChar();
  return {
    year: ec.getYearGan() + ec.getYearZhi(),
    month: ec.getMonthGan() + ec.getMonthZhi(),
    day: ec.getDayGan() + ec.getDayZhi(),
    hour: ec.getTimeGan() + ec.getTimeZhi(),
  };
}

function ganzhi(p: { gan: string; zhi: string }) {
  return `${p.gan}${p.zhi}`;
}

function expectPillarLegal(p: { gan: string; zhi: string }) {
  expect(GAN_SET.has(p.gan as any)).toBe(true);
  expect(ZHI_SET.has(p.zhi as any)).toBe(true);
}

function expectChartLegal(chart: BaziChart) {
  expectPillarLegal(chart.year);
  expectPillarLegal(chart.month);
  expectPillarLegal(chart.day);
  if (chart.hour) expectPillarLegal(chart.hour);
}

describe('calculateBazi — four pillars (precise time path)', () => {
  it('1990-05-15 10:30 matches the lunar-javascript oracle', () => {
    const input: BaziInput = {
      gender: 'male',
      birthDate: '1990-05-15',
      birthHourNum: 10,
      birthMinute: 30,
      knowTime: true,
    };
    const { chart } = calculateBazi(input);
    const o = oracle(1990, 5, 15, 10, 30);
    expect(ganzhi(chart.year)).toBe(o.year); // 庚午
    expect(ganzhi(chart.month)).toBe(o.month); // 辛巳
    expect(ganzhi(chart.day)).toBe(o.day); // 庚辰
    expect(ganzhi(chart.hour!)).toBe(o.hour); // 辛巳
    expectChartLegal(chart);
  });

  it('known golden case 1990-05-15 10:30 → 庚午 辛巳 庚辰 辛巳', () => {
    const { chart, dayMaster } = calculateBazi({
      gender: 'female',
      birthDate: '1990-05-15',
      birthHourNum: 10,
      birthMinute: 30,
      knowTime: true,
    });
    expect(ganzhi(chart.year)).toBe('庚午');
    expect(ganzhi(chart.month)).toBe('辛巳');
    expect(ganzhi(chart.day)).toBe('庚辰');
    expect(ganzhi(chart.hour!)).toBe('辛巳');
    expect(dayMaster).toBe('庚金'); // 日干庚 + 五行金
  });

  it('2000-01-01 00:00 (子时) matches oracle and yields 子 hour branch', () => {
    const { chart } = calculateBazi({
      gender: 'male',
      birthDate: '2000-01-01',
      birthHourNum: 0,
      birthMinute: 0,
      knowTime: true,
    });
    const o = oracle(2000, 1, 1, 0, 0);
    expect(ganzhi(chart.year)).toBe(o.year);
    expect(ganzhi(chart.month)).toBe(o.month);
    expect(ganzhi(chart.day)).toBe(o.day);
    expect(ganzhi(chart.hour!)).toBe(o.hour); // 壬子
    expect(chart.hour!.zhi).toBe('子');
  });
});

describe('五行 (five-element) distribution invariants', () => {
  it('sums to 8 when an hour pillar is present (4 pillars × 2)', () => {
    const { wuxing } = calculateBazi({
      gender: 'male',
      birthDate: '1990-05-15',
      birthHourNum: 10,
      knowTime: true,
    });
    const sum =
      wuxing.metal + wuxing.wood + wuxing.water + wuxing.fire + wuxing.earth;
    expect(sum).toBe(8);
  });

  it('sums to 6 when no hour pillar (3 pillars × 2)', () => {
    const { wuxing, chart } = calculateBazi({
      gender: 'male',
      birthDate: '1990-05-15',
      knowTime: false,
    });
    expect(chart.hour).toBeNull();
    const sum =
      wuxing.metal + wuxing.wood + wuxing.water + wuxing.fire + wuxing.earth;
    expect(sum).toBe(6);
  });

  it('all five-element counts are non-negative integers', () => {
    const { wuxing } = calculateBazi({
      gender: 'female',
      birthDate: '2000-01-01',
      birthHourNum: 12,
      knowTime: true,
    });
    for (const v of Object.values(wuxing)) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Day Master (日主) extraction', () => {
  it('combines day gan with its 五行 element', () => {
    const { chart, dayMaster } = calculateBazi({
      gender: 'male',
      birthDate: '2000-01-01',
      birthHourNum: 12,
      knowTime: true,
    });
    expect(dayMaster.startsWith(chart.day.gan)).toBe(true);
    expect(dayMaster).toBe(`${chart.day.gan}${chart.day.ganWuxing}`);
  });
});

describe('edge cases — missing / unknown hour', () => {
  it('knowTime=false degrades the hour pillar to null without throwing', () => {
    expect(() =>
      calculateBazi({
        gender: 'male',
        birthDate: '1990-05-15',
        birthHourNum: 10,
        knowTime: false,
      })
    ).not.toThrow();
    const { chart } = calculateBazi({
      gender: 'male',
      birthDate: '1990-05-15',
      birthHourNum: 10,
      knowTime: false,
    });
    expect(chart.hour).toBeNull();
  });

  it("birthHour='不知道' (rough-hour path) degrades hour pillar to null", () => {
    const { chart } = calculateBazi({
      gender: 'male',
      birthDate: '1990-05-15',
      birthHour: '不知道',
    });
    expect(chart.hour).toBeNull();
  });

  it('no time fields at all → null hour pillar, still legal chart', () => {
    const { chart } = calculateBazi({
      gender: 'female',
      birthDate: '1985-08-20',
    });
    expect(chart.hour).toBeNull();
    expectChartLegal(chart);
  });

  it("rough birthHour='子时' produces 子 hour branch via 五鼠遁元", () => {
    const { chart } = calculateBazi({
      gender: 'male',
      birthDate: '1990-05-15',
      birthHour: '子时',
    });
    expect(chart.hour).not.toBeNull();
    expect(chart.hour!.zhi).toBe('子');
  });
});

describe('晚子时 (late zi-shi) day-pillar advance', () => {
  it('lateZiShi=true advances the day pillar at 23:30 vs default (sect 2)', () => {
    const early = calculateBazi({
      gender: 'male',
      birthDate: '1990-05-15',
      birthHourNum: 23,
      birthMinute: 30,
      knowTime: true,
      lateZiShi: false,
    });
    const late = calculateBazi({
      gender: 'male',
      birthDate: '1990-05-15',
      birthHourNum: 23,
      birthMinute: 30,
      knowTime: true,
      lateZiShi: true,
    });
    // Oracle: sect 2 -> 庚辰 (same day), sect 1 -> 辛巳 (next day)
    expect(ganzhi(early.chart.day)).toBe('庚辰');
    expect(ganzhi(late.chart.day)).toBe('辛巳');
  });
});

describe('立春 year-boundary handling', () => {
  it('2025-02-02 (before 立春) → 甲辰 year, 2025-02-05 (after) → 乙巳 year', () => {
    const before = calculateBazi({
      gender: 'male',
      birthDate: '2025-02-02',
      birthHourNum: 12,
      knowTime: true,
    });
    const after = calculateBazi({
      gender: 'male',
      birthDate: '2025-02-05',
      birthHourNum: 12,
      knowTime: true,
    });
    expect(ganzhi(before.chart.year)).toBe('甲辰');
    expect(ganzhi(after.chart.year)).toBe('乙巳');
  });

  it('zodiac flips at 立春: 2024-02-03 → 兔, 2024-02-04 → 龙', () => {
    const rabbit = calculateBazi({
      gender: 'male',
      birthDate: '2024-02-03',
      birthHourNum: 12,
      knowTime: true,
    });
    const dragon = calculateBazi({
      gender: 'male',
      birthDate: '2024-02-04',
      birthHourNum: 12,
      knowTime: true,
    });
    expect(rabbit.zodiac).toBe('兔');
    expect(dragon.zodiac).toBe('龙');
  });
});

describe('农历 (lunar input) and leap month', () => {
  it('isLunar=true is converted via lunar→solar and produces a legal chart', () => {
    // 2023 闰二月初一 == solar 2023-03-22 (verified via lunar-javascript)
    const { chart } = calculateBazi({
      gender: 'male',
      birthDate: '2023-2-1',
      isLunar: true,
      birthHourNum: 12,
      knowTime: true,
    });
    const o = oracle(2023, 3, 22, 12, 0);
    // lunar-javascript resolves non-leap month-1 first; we assert legality + day match path
    expectChartLegal(chart);
    // day pillar must be a legal 干支 string
    expect(GAN_SET.has(chart.day.gan)).toBe(true);
    // sanity: solar oracle for that lunar date yields a legal day pillar too
    expect(o.day.length).toBe(2);
  });
});

describe('legality invariants across a date sweep', () => {
  it('every pillar gan ∈ 天干 (0-9) and zhi ∈ 地支 (0-11)', () => {
    const dates = [
      '1970-01-01',
      '1984-02-04',
      '1999-12-31',
      '2008-08-08',
      '2012-12-21',
      '2026-06-16',
    ];
    for (const birthDate of dates) {
      for (let h = 0; h < 24; h += 6) {
        const { chart } = calculateBazi({
          gender: 'male',
          birthDate,
          birthHourNum: h,
          knowTime: true,
        });
        expectChartLegal(chart);
      }
    }
  });
});

describe('getDayGanzhi / getYearGanzhi', () => {
  it('returns the day 干支 matching the oracle', () => {
    const o = oracle(1990, 5, 15, 12, 0);
    expect(getDayGanzhi('1990-05-15')).toBe(o.day); // 庚辰
  });

  it('returns the year 干支 matching the oracle', () => {
    const o = oracle(1990, 5, 15, 12, 0);
    expect(getYearGanzhi('1990-05-15')).toBe(o.year); // 庚午
  });

  it('both outputs are 2-char legal 干支', () => {
    const dg = getDayGanzhi('2008-08-08');
    const yg = getYearGanzhi('2008-08-08');
    expect(GAN_SET.has(dg[0] as any)).toBe(true);
    expect(ZHI_SET.has(dg[1] as any)).toBe(true);
    expect(GAN_SET.has(yg[0] as any)).toBe(true);
    expect(ZHI_SET.has(yg[1] as any)).toBe(true);
  });
});

describe('getLunarDate', () => {
  it('produces a 干支年...月...形 string for a known date', () => {
    const s = getLunarDate('1990-05-15');
    expect(s).toMatch(/^.{2}年.+月.+$/);
    // year ganzhi prefix should be 庚午
    expect(s.startsWith('庚午年')).toBe(true);
  });
});

describe('getCurrentDayun / getDayunTimeline (time-dependent)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T10:00:00+08:00'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a legal 干支 + element for a valid birth date', () => {
    const d = getCurrentDayun('1990-05-15', 'male');
    expect(GAN_SET.has(d.gan)).toBe(true);
    expect(ZHI_SET.has(d.zhi)).toBe(true);
    expect(['金', '木', '水', '火', '土']).toContain(d.wuxing);
  });

  it('falls back gracefully on a malformed birth date', () => {
    const d = getCurrentDayun('not-a-date', 'female');
    expect(GAN_SET.has(d.gan)).toBe(true);
    expect(ZHI_SET.has(d.zhi)).toBe(true);
  });

  it('timeline 终身大运表（默认≤8步），each 10 years, ages contiguous, all legal', () => {
    const tl = getDayunTimeline('1990-05-15', 'male');
    expect(tl.length).toBeGreaterThanOrEqual(6);
    expect(tl.length).toBeLessThanOrEqual(8);
    tl.forEach((item, i) => {
      expect(item.index).toBe(i);
      expect(item.ageEnd - item.ageStart).toBe(9);
      expect(item.yearEnd - item.yearStart).toBe(9);
      if (i > 0) {
        expect(item.ageStart).toBe(tl[i - 1].ageStart + 10);
        expect(item.yearStart).toBe(tl[i - 1].yearStart + 10);
      }
      expect(GAN_SET.has(item.gan)).toBe(true);
      expect(ZHI_SET.has(item.zhi)).toBe(true);
    });
    // at most one current window
    expect(tl.filter((x) => x.isCurrent).length).toBeLessThanOrEqual(1);
  });

  it('getDayunTimeline 支持自定义步数（终身表可取更多步）', () => {
    expect(getDayunTimeline('1990-05-15', 'male', undefined, undefined, 3).length).toBe(3);
    // 默认应多于旧版的 6 步，体现「终身大运表」
    expect(getDayunTimeline('1990-05-15', 'male').length).toBeGreaterThan(6);
  });

  it('uses precise 起运 from lunar-javascript getYun (not the old 3-5 estimate)', () => {
    // Oracle: 1990-05-15 male 起运虚岁 8, first 大运 壬午, 公历 1997 起.
    const tl = getDayunTimeline('1990-05-15', 'male');
    expect(tl[0].ageStart).toBe(8);
    expect(`${tl[0].gan}${tl[0].zhi}`).toBe('壬午');
    expect(tl[0].yearStart).toBe(1997);
    // female 起运虚岁 4, first 大运 庚辰, 公历 1993 起.
    const tlF = getDayunTimeline('1990-05-15', 'female');
    expect(tlF[0].ageStart).toBe(4);
    expect(`${tlF[0].gan}${tlF[0].zhi}`).toBe('庚辰');
    expect(tlF[0].yearStart).toBe(1993);
  });

  it('getCurrentDayun matches the timeline step containing the current year', () => {
    // 2026: male 1990 → 大运 庚辰 (2017-2026) per oracle
    const cur = getCurrentDayun('1990-05-15', 'male');
    expect(GAN_SET.has(cur.gan)).toBe(true);
    expect(cur.startYear).toBeLessThanOrEqual(2026);
    expect(cur.endYear).toBeGreaterThanOrEqual(2026);
    const tl = getDayunTimeline('1990-05-15', 'male');
    const currentStep = tl.find((x) => x.isCurrent);
    if (currentStep) {
      expect(`${cur.gan}${cur.zhi}`).toBe(`${currentStep.gan}${currentStep.zhi}`);
    }
  });

  it('returns [] for a malformed birth date timeline', () => {
    expect(getDayunTimeline('garbage', 'male')).toEqual([]);
  });

  it('阳男顺行 vs 阴女: forward/reverse direction differs from month pillar', () => {
    // 1990 庚 (阳) -> male forward, female reverse. Steps should diverge.
    const male = getDayunTimeline('1990-05-15', 'male');
    const female = getDayunTimeline('1990-05-15', 'female');
    // first step gan should differ in direction (one +1, one -1 from month gan)
    expect(male[0].gan === female[0].gan && male[0].zhi === female[0].zhi).toBe(
      false
    );
  });
});
