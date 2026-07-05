import { describe, it, expect } from 'vitest';
import { getTodayBeijing, getBeijingDate, getSecondsUntilBeijingMidnight } from './timezone';

describe('timezone · 北京时间边界', () => {
  it('getTodayBeijing:UTC 16:00 已跨北京次日 0 点', () => {
    // 2026-07-04T16:00:00Z = 北京 2026-07-05 00:00
    expect(getTodayBeijing(new Date('2026-07-04T16:00:00Z'))).toBe('2026-07-05');
    // UTC 15:59:59 仍是北京 07-04 23:59
    expect(getTodayBeijing(new Date('2026-07-04T15:59:59Z'))).toBe('2026-07-04');
  });

  it('getBeijingDate 的 UTC 取值即北京墙钟', () => {
    const d = getBeijingDate(new Date('2026-07-04T02:00:00Z')); // 北京 10:00
    expect(d.getUTCHours()).toBe(10);
  });

  describe('getSecondsUntilBeijingMidnight', () => {
    it('北京午夜整点 → 整天 86400', () => {
      // 北京 00:00 = UTC 前一日 16:00
      expect(getSecondsUntilBeijingMidnight(new Date('2026-07-04T16:00:00Z'))).toBe(86400);
    });

    it('北京 08:00(旧 UTC 午夜 TTL 的错误边界)→ 还剩 16h', () => {
      // 北京 08:00 = UTC 00:00。旧写法此刻 TTL 归零导致 key 提前失效 → 游客二次配额。
      const secs = getSecondsUntilBeijingMidnight(new Date('2026-07-04T00:00:00Z'));
      expect(secs).toBe(16 * 3600); // 57600
    });

    it('北京 23:59:59 → 还剩 1 秒(恒为正数)', () => {
      const secs = getSecondsUntilBeijingMidnight(new Date('2026-07-04T15:59:59Z'));
      expect(secs).toBe(1);
      expect(secs).toBeGreaterThan(0);
    });

    it('任意时刻:key(北京日) 与 TTL 边界一致 —— 加满 TTL 秒后恰好跨到次日', () => {
      const now = new Date('2026-07-04T05:30:00Z'); // 北京 13:30
      const ttl = getSecondsUntilBeijingMidnight(now);
      const atExpiry = new Date(now.getTime() + ttl * 1000);
      expect(getTodayBeijing(atExpiry)).toBe('2026-07-05'); // 过期即已跨北京次日
      expect(getTodayBeijing(now)).toBe('2026-07-04');
    });
  });
});
