// 北京时间日期工具：所有配额日期、缓存键日期统一走这里。

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

export function getTodayBeijing(date: Date = new Date()): string {
  const beijing = new Date(date.getTime() + BEIJING_OFFSET_MS);
  return beijing.toISOString().split('T')[0];
}

export function getBeijingDate(date: Date = new Date()): Date {
  return new Date(date.getTime() + BEIJING_OFFSET_MS);
}
