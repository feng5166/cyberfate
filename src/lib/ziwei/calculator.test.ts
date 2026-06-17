import { describe, it, expect } from 'vitest';
import {
  calculateZiwei,
  calcMingGong,
  calcShenGong,
  calcZiweiPosition,
  calcTianfuPosition,
  getPalaceStem,
  adjustTrueSolarTime,
  indexToDizhi,
  indexToTiangan,
} from './calculator';
import {
  DIZHI_LIST,
  TIANGAN_LIST,
  PALACE_NAMES,
  NAYIN_WUXINGJU,
  WUXINGJU_NAME,
} from './constants';
import type { ZiweiInput } from './types';

// The 14 major stars in 紫微斗数.
const MAJOR_STARS = [
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞', // 紫微星系
  '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军', // 天府星系
];

// Two known birth inputs (golden derived from real calculateZiwei output).
const INPUT_A: ZiweiInput = { birthDate: '1990-08-15', birthHour: 5, gender: 'male' };
const INPUT_B: ZiweiInput = { birthDate: '2000-01-01', birthHour: 0, gender: 'female' };

describe('ziwei pure helpers — range safety', () => {
  it('indexToDizhi always returns a valid 地支 for any integer (positive mod)', () => {
    for (let i = -50; i <= 50; i++) {
      const dz = indexToDizhi(i);
      expect(DIZHI_LIST).toContain(dz);
    }
  });

  it('indexToTiangan always returns a valid 天干 for any integer (positive mod)', () => {
    for (let i = -50; i <= 50; i++) {
      const tg = indexToTiangan(i);
      expect(TIANGAN_LIST).toContain(tg);
    }
  });

  it('calcMingGong stays within palace index range 0-11 for all month/hour combos', () => {
    for (let month = 1; month <= 12; month++) {
      for (let hour = 0; hour <= 11; hour++) {
        const idx = calcMingGong(month, hour);
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThanOrEqual(11);
        expect(Number.isInteger(idx)).toBe(true);
      }
    }
  });

  it('calcShenGong stays within palace index range 0-11 for all month/hour combos', () => {
    for (let month = 1; month <= 12; month++) {
      for (let hour = 0; hour <= 11; hour++) {
        const idx = calcShenGong(month, hour);
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThanOrEqual(11);
      }
    }
  });

  it('calcZiweiPosition stays within 0-11 for every 五行局 and lunar day 1-30', () => {
    for (const ju of [2, 3, 4, 5, 6]) {
      for (let day = 1; day <= 30; day++) {
        const idx = calcZiweiPosition(day, ju);
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThanOrEqual(11);
      }
    }
  });

  it('calcTianfuPosition mirrors 紫微 about 寅宫 and stays in range', () => {
    for (let ziwei = 0; ziwei <= 11; ziwei++) {
      const tianfu = calcTianfuPosition(ziwei);
      expect(tianfu).toBeGreaterThanOrEqual(0);
      expect(tianfu).toBeLessThanOrEqual(11);
      // (4 - ziwei + 12) % 12
      expect(tianfu).toBe(((4 - ziwei) % 12 + 12) % 12);
    }
  });

  it('getPalaceStem returns a valid 天干 for every year-gan / branch combination', () => {
    for (const yearGan of TIANGAN_LIST) {
      for (const branch of DIZHI_LIST) {
        const stem = getPalaceStem(yearGan, branch);
        expect(TIANGAN_LIST).toContain(stem);
      }
    }
  });
});

describe('ziwei known-formula checks', () => {
  it('calcMingGong: 寅宫起正月顺数，子时(0) of 1月 -> 寅(index 2)', () => {
    // monthPalaceIndex = (2 + 1 - 1) % 12 = 2; minus hour 0 -> 2 (寅)
    expect(calcMingGong(1, 0)).toBe(2);
    expect(indexToDizhi(calcMingGong(1, 0))).toBe('寅');
  });

  it('calcShenGong: 寅宫起正月顺数，子时(0) of 1月 -> 寅(index 2)', () => {
    expect(calcShenGong(1, 0)).toBe(2);
  });

  it('命宫与身宫在子时(0)时相同（顺逆同点）', () => {
    for (let month = 1; month <= 12; month++) {
      expect(calcMingGong(month, 0)).toBe(calcShenGong(month, 0));
    }
  });
});

describe('五行局 (NAYIN_WUXINGJU) derivation', () => {
  it('every 纳音 entry maps to a known 五行局 number and named 局', () => {
    const values = Object.values(NAYIN_WUXINGJU);
    expect(values.length).toBe(60); // full 六十甲子 cycle
    for (const v of values) {
      expect([2, 3, 4, 5, 6]).toContain(v);
      expect(WUXINGJU_NAME[v]).toBeDefined();
    }
  });

  it('五行局 number is consistent with the 局名 used by calculateZiwei', () => {
    const r = calculateZiwei(INPUT_A);
    expect(WUXINGJU_NAME[r.debug.wuxingJuNumber]).toBe(r.wuxingJu);
    expect([2, 3, 4, 5, 6]).toContain(r.debug.wuxingJuNumber);
  });
});

describe('adjustTrueSolarTime', () => {
  it('no longitude -> no adjustment', () => {
    expect(adjustTrueSolarTime(5)).toEqual({ adjustedHour: 5, offsetMinutes: 0 });
  });

  it('longitude 120 (standard meridian) -> zero offset', () => {
    const { offsetMinutes } = adjustTrueSolarTime(5, 120);
    expect(offsetMinutes).toBe(0);
  });

  it('adjusted hour stays within 0-11 for any longitude', () => {
    for (const lon of [70, 90, 116, 120, 135]) {
      for (let h = 0; h <= 11; h++) {
        const { adjustedHour } = adjustTrueSolarTime(h, lon);
        expect(adjustedHour).toBeGreaterThanOrEqual(0);
        expect(adjustedHour).toBeLessThanOrEqual(11);
      }
    }
  });
});

describe('calculateZiwei — 12 palaces & 14 major stars', () => {
  for (const input of [INPUT_A, INPUT_B]) {
    describe(`input ${input.birthDate} hour=${input.birthHour}`, () => {
      const result = calculateZiwei(input);

      it('produces exactly 12 palaces with the standard palace names', () => {
        expect(result.palaces).toHaveLength(12);
        expect(result.palaces.map((p) => p.name)).toEqual([...PALACE_NAMES]);
      });

      it('every palace has a valid branch and stem', () => {
        for (const p of result.palaces) {
          expect(DIZHI_LIST).toContain(p.branch);
          expect(TIANGAN_LIST).toContain(p.stem);
        }
      });

      it('the 12 palace branches are all distinct (cover all 12 地支)', () => {
        const branches = result.palaces.map((p) => p.branch);
        expect(new Set(branches).size).toBe(12);
      });

      it('all 14 major stars are placed, each into a valid palace, none duplicated', () => {
        const placed: string[] = [];
        for (const p of result.palaces) {
          for (const s of p.majorStars) {
            expect(s.type).toBe('major');
            placed.push(s.name);
          }
        }
        // Every major star appears exactly once.
        for (const star of MAJOR_STARS) {
          expect(placed.filter((n) => n === star)).toHaveLength(1);
        }
        expect(placed).toHaveLength(MAJOR_STARS.length);
      });

      it('exactly one 命宫 (isLife) and one 身宫 (isBody)', () => {
        expect(result.palaces.filter((p) => p.isLife)).toHaveLength(1);
        expect(result.palaces.filter((p) => p.isBody)).toHaveLength(1);
      });

      it('mingGong / shenGong returned at top-level match the flagged palaces', () => {
        const life = result.palaces.find((p) => p.isLife)!;
        const body = result.palaces.find((p) => p.isBody)!;
        expect(life.branch).toBe(result.mingGong);
        expect(body.branch).toBe(result.shenGong);
        // 命宫 is always the first palace (名为「命宫」)
        expect(life.name).toBe('命宫');
      });

      it('mingzhu and shenzhu are non-empty strings', () => {
        expect(typeof result.mingzhu).toBe('string');
        expect(result.mingzhu.length).toBeGreaterThan(0);
        expect(typeof result.shenzhu).toBe('string');
        expect(result.shenzhu.length).toBeGreaterThan(0);
      });
    });
  }
});

describe('calculateZiwei — golden / characterization values', () => {
  it('1990-08-15 hour=5 (male) — characterization', () => {
    const r = calculateZiwei(INPUT_A);
    // characterization (pinned from current sanhe engine output)
    expect(r.mingGong).toBe('寅');
    expect(r.shenGong).toBe('子');
    expect(r.wuxingJu).toBe('土五局');
    expect(r.debug.ziweiStarBranch).toBe('午');
    expect(r.debug.yearGanZhi).toBe('庚午');
    expect(r.mingzhu).toBe('禄存');
    expect(r.shenzhu).toBe('火星');
    const life = r.palaces.find((p) => p.isLife)!;
    expect(life.majorStars.map((s) => s.name).sort()).toEqual(['天相', '武曲'].sort());
  });

  it('2000-01-01 hour=0 (female) — characterization', () => {
    const r = calculateZiwei(INPUT_B);
    // characterization
    expect(r.mingGong).toBe('子');
    expect(r.shenGong).toBe('子');
    expect(r.wuxingJu).toBe('水二局');
    expect(r.debug.ziweiStarBranch).toBe('卯');
    expect(r.debug.yearGanZhi).toBe('己卯');
    // 命宫与身宫同宫
    expect(r.mingGong).toBe(r.shenGong);
  });
});

describe('calculateZiwei — 四化 applied per year-gan', () => {
  it('places at most one of each 四化 type across the chart', () => {
    const r = calculateZiwei(INPUT_A);
    const counts: Record<string, number> = {};
    for (const p of r.palaces) {
      for (const list of [p.majorStars, p.minorStars, p.auxiliaryStars]) {
        for (const s of list) {
          if (s.sihua) counts[s.sihua] = (counts[s.sihua] ?? 0) + 1;
        }
      }
    }
    for (const v of Object.values(counts)) {
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('calculateZiwei — input guards & edge cases', () => {
  it('throws on invalid birthDate', () => {
    expect(() => calculateZiwei({ birthDate: 'not-a-date', birthHour: 0, gender: 'male' })).toThrow();
  });

  it('throws on birthHour below range', () => {
    expect(() => calculateZiwei({ birthDate: '1990-08-15', birthHour: -1, gender: 'male' })).toThrow(/时辰/);
  });

  it('throws on birthHour above range', () => {
    expect(() => calculateZiwei({ birthDate: '1990-08-15', birthHour: 12, gender: 'male' })).toThrow(/时辰/);
  });

  it('accepts both boundary hours 0 and 11', () => {
    expect(() => calculateZiwei({ birthDate: '1990-08-15', birthHour: 0, gender: 'male' })).not.toThrow();
    expect(() => calculateZiwei({ birthDate: '1990-08-15', birthHour: 11, gender: 'male' })).not.toThrow();
  });

  it('gender male vs female does not change palace structure (engine is gender-neutral for placement)', () => {
    const male = calculateZiwei({ ...INPUT_A, gender: 'male' });
    const female = calculateZiwei({ ...INPUT_A, gender: 'female' });
    expect(male.mingGong).toBe(female.mingGong);
    expect(male.palaces.map((p) => p.branch)).toEqual(female.palaces.map((p) => p.branch));
  });

  it('handles a leap-month birth date without throwing and yields a positive lunarMonth', () => {
    // 2020 had a leap 4th month (闰四月). A date inside it exercises Math.abs(month).
    const r = calculateZiwei({ birthDate: '2020-06-01', birthHour: 3, gender: 'female' });
    expect(r.debug.lunarMonth).toBeGreaterThan(0);
    expect(r.debug.lunarMonth).toBeLessThanOrEqual(12);
    expect(r.palaces).toHaveLength(12);
  });

  it('birthPlace longitude exercises true-solar-time path and exposes offset', () => {
    const r = calculateZiwei({
      ...INPUT_A,
      birthPlace: { longitude: 116.4, latitude: 39.9 },
    });
    expect(r.debug.trueSolarOffset).toBeDefined();
    expect(typeof r.debug.trueSolarOffset).toBe('number');
    expect(r.palaces).toHaveLength(12);
  });
});
