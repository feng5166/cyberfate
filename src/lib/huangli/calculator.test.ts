import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  calculateHuangli,
  getMonthLunarDays,
  getZhiXingColor,
  WUXING_COLORS,
  type HuangliData,
} from './calculator';

const WUXING = ['金', '木', '水', '火', '土'];
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

afterEach(() => {
  vi.useRealTimers();
});

describe('calculateHuangli — known date 2026-06-17', () => {
  const h = calculateHuangli('2026-06-17');

  it('parses the solar fields', () => {
    expect(h.solarYear).toBe(2026);
    expect(h.solarMonth).toBe(6);
    expect(h.solarDay).toBe(17);
    expect(h.solar).toBe('2026年6月17日');
  });

  it('weekday is 星期三 (2026-06-17 is a Wednesday)', () => {
    expect(h.weekday).toBe('星期三');
    expect(WEEKDAYS).toContain(h.weekday);
  });

  it('lunar conversion — 农历2026年五月初三', () => {
    // characterization (lunar-javascript)
    expect(h.lunarYear).toBe(2026);
    expect(h.lunarMonth).toBe(5);
    expect(h.lunarDay).toBe(3);
    expect(h.lunarMonthName).toBe('五');
    expect(h.lunarDayName).toBe('初三');
  });

  it('day 干支 / 纳音 / 五行 for the day', () => {
    // characterization (lunar-javascript): 日柱 壬戌，纳音 大海水
    expect(h.dayGanzhi).toBe('壬戌');
    expect(h.dayGan).toBe('壬');
    expect(h.dayZhi).toBe('戌');
    expect(h.dayNayin).toBe('大海水');
    // 壬 -> 水
    expect(h.dayWuxing).toBe('水');
    expect(WUXING).toContain(h.dayWuxing);
    expect(WUXING).toContain(h.yearWuxing);
  });

  it('生肖 present and 冲煞 / 太岁(神煞) fields populated', () => {
    expect(h.shengxiao).toBe('马');
    expect(h.chong).toBe('辰');
    expect(h.chongShengxiao).toBe('龙');
    expect(typeof h.chongDesc).toBe('string');
    expect(h.chongDesc.length).toBeGreaterThan(0);
    expect(typeof h.sha).toBe('string');
    expect(h.sha.length).toBeGreaterThan(0);
    // 太岁/神煞扩展字段存在
    expect(typeof h.taishen).toBe('string');
    expect(h.taishen.length).toBeGreaterThan(0);
  });

  it('宜 / 忌 are non-empty arrays', () => {
    expect(Array.isArray(h.yi)).toBe(true);
    expect(Array.isArray(h.ji)).toBe(true);
    expect(h.yi.length).toBeGreaterThan(0);
    expect(h.ji.length).toBeGreaterThan(0);
  });

  it('建除十二神 (zhiXing) and 神煞 lists present', () => {
    expect(typeof h.zhiXing).toBe('string');
    expect(h.zhiXing.length).toBeGreaterThan(0);
    expect(Array.isArray(h.jiShen)).toBe(true);
    expect(Array.isArray(h.xiongSha)).toBe(true);
  });
});

describe('calculateHuangli — structural invariants on arbitrary dates', () => {
  const dates = ['1920-01-01', '1988-02-29', '2000-12-31', '2026-06-17', '2100-12-31'];
  for (const d of dates) {
    it(`${d}: returns a well-formed HuangliData object`, () => {
      const h = calculateHuangli(d);
      expect(WEEKDAYS).toContain(h.weekday);
      expect(h.dayGanzhi.length).toBe(2);
      expect(h.yearGanzhi.length).toBe(2);
      expect(h.monthGanzhi.length).toBe(2);
      expect(WUXING).toContain(h.dayWuxing);
      expect(WUXING).toContain(h.yearWuxing);
      expect(Array.isArray(h.yi)).toBe(true);
      expect(Array.isArray(h.ji)).toBe(true);
      expect(Array.isArray(h.jiShen)).toBe(true);
      expect(Array.isArray(h.xiongSha)).toBe(true);
    });
  }

  it('weekday is correct against native Date for several dates', () => {
    for (const d of dates) {
      const [y, m, day] = d.split('-').map(Number);
      const expected = WEEKDAYS[new Date(y, m - 1, day).getDay()];
      expect(calculateHuangli(d).weekday).toBe(expected);
    }
  });
});

describe('calculateHuangli — date range guards (1920-2100) handled without throwing', () => {
  it('lower bound 1920-01-01 does not throw', () => {
    expect(() => calculateHuangli('1920-01-01')).not.toThrow();
  });

  it('upper bound 2100-12-31 does not throw', () => {
    expect(() => calculateHuangli('2100-12-31')).not.toThrow();
  });

  it('leap day 2000-02-29 does not throw and reports 星期二', () => {
    expect(() => calculateHuangli('2000-02-29')).not.toThrow();
    expect(calculateHuangli('2000-02-29').weekday).toBe(WEEKDAYS[new Date(2000, 1, 29).getDay()]);
  });

  it('out-of-range / edge dates are handled without throwing (engine clamps, not crashes)', () => {
    // dates outside the documented 1920-2100 window must not crash the calculator.
    expect(() => calculateHuangli('1900-01-01')).not.toThrow();
    expect(() => calculateHuangli('2200-06-15')).not.toThrow();
  });
});

describe('getMonthLunarDays', () => {
  it('returns one entry per calendar day of the month (June 2026 -> 30 days)', () => {
    const days = getMonthLunarDays(2026, 6);
    expect(days).toHaveLength(30);
    expect(days[0].day).toBe(1);
    expect(days[29].day).toBe(30);
    for (const entry of days) {
      expect(typeof entry.lunarDay).toBe('string');
      expect(entry.lunarDay.length).toBeGreaterThan(0);
      expect(typeof entry.jieqi).toBe('string');
    }
  });

  it('handles February in a leap year (2024 -> 29 days)', () => {
    expect(getMonthLunarDays(2024, 2)).toHaveLength(29);
  });

  it('handles February in a non-leap year (2026 -> 28 days)', () => {
    expect(getMonthLunarDays(2026, 2)).toHaveLength(28);
  });
});

describe('time-dependent: calculating "today" with fake timers', () => {
  it('computing huangli for the faked current date works', () => {
    vi.useFakeTimers();
    // 用 UTC 正午 + getUTC* 派生日期，避免测试机时区（如 PDT）把「今天」滚到前一天，导致 flaky
    vi.setSystemTime(new Date('2026-06-17T12:00:00Z'));
    const now = new Date();
    const iso = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(
      now.getUTCDate(),
    ).padStart(2, '0')}`;
    const h = calculateHuangli(iso);
    expect(h.solarYear).toBe(2026);
    expect(h.solarMonth).toBe(6);
    expect(h.solarDay).toBe(17);
    expect(h.weekday).toBe('星期三');
  });
});

describe('color / classification helpers', () => {
  it('WUXING_COLORS has an entry for every 五行', () => {
    for (const w of WUXING) {
      expect(WUXING_COLORS[w as keyof typeof WUXING_COLORS]).toBeDefined();
      expect(WUXING_COLORS[w as keyof typeof WUXING_COLORS].hex).toMatch(/^#/);
    }
  });

  it('getZhiXingColor classifies good / bad / neutral 建除神', () => {
    expect(getZhiXingColor('建').text).toContain('green');
    expect(getZhiXingColor('破').text).toContain('red');
    // 定 is neither in good nor bad list -> neutral gray
    expect(getZhiXingColor('定').text).toContain('gray');
  });

  it("2026-06-17 zhiXing is 定 -> neutral classification", () => {
    const h: HuangliData = calculateHuangli('2026-06-17');
    expect(h.zhiXing).toBe('定');
    expect(getZhiXingColor(h.zhiXing).text).toContain('gray');
  });
});
