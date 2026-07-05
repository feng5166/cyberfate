// 北京时间日期工具：所有配额日期、缓存键日期统一走这里。

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

export function getTodayBeijing(date: Date = new Date()): string {
  const beijing = new Date(date.getTime() + BEIJING_OFFSET_MS);
  return beijing.toISOString().split('T')[0];
}

export function getBeijingDate(date: Date = new Date()): Date {
  return new Date(date.getTime() + BEIJING_OFFSET_MS);
}

/**
 * 距下一个「北京午夜」还有多少秒。
 * 用于 Redis TTL：让缓存/限流键的过期边界与「按北京日滚动的键」对齐，
 * 避免 TTL 走服务器/UTC 午夜(=北京 08:00)导致的当天提前失效 / 游客二次配额。
 * 恒返回 1..86400 的正数(北京午夜整点返回 86400)。
 */
export function getSecondsUntilBeijingMidnight(date: Date = new Date()): number {
  const beijing = getBeijingDate(date); // UTC 取值即北京墙钟
  const secondsIntoDay =
    beijing.getUTCHours() * 3600 + beijing.getUTCMinutes() * 60 + beijing.getUTCSeconds();
  return 86400 - secondsIntoDay;
}
