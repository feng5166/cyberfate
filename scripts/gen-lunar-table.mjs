#!/usr/bin/env node
// 生成 src/components/ui/lunarMonthTable.ts —— 1900-2100 每个农历月天数 + 闰月位的紧凑查表。
//
// 为什么：lunar-javascript 是 436KB 的 CJS 单文件库，客户端任何 value-import 都会把整库
// (299KB raw / 97KB gz) 拖进首屏。DatePicker 仅需要「某农历月是 29 还是 30 天」这一个数字，
// 查表即可，无需整库。表由本脚本在 node 端用 lunar-javascript 预计算生成。
//
// 用法：
//   node scripts/gen-lunar-table.mjs           重新生成 src/components/ui/lunarMonthTable.ts
//   node scripts/gen-lunar-table.mjs --verify  随机抽 200 个年月，对拍已生成的表与 lunar-javascript
//
// 编码（每年 1 个整数，≤17 bit）：
//   bit0..11  = 正月..腊月（非闰月）是否 30 天（1=30，0=29）
//   bit12..15 = 闰月月序（0=无闰）
//   bit16     = 闰月是否 30 天
import { createRequire } from 'node:module';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { LunarMonth, LunarYear } = require('lunar-javascript');

const FIRST_YEAR = 1900;
const LAST_YEAR = 2100;
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'src', 'components', 'ui', 'lunarMonthTable.ts');

/** 用 lunar-javascript 编码某农历年为 1 个整数（编码规则见文件头）。 */
function encodeYear(year) {
  let v = 0;
  for (let m = 1; m <= 12; m++) {
    const c = LunarMonth.fromYm(year, m).getDayCount();
    if (c === 30) v |= 1 << (m - 1);
    else if (c !== 29) throw new Error(`意外的月天数 ${year}-${m}: ${c}`);
  }
  const leap = LunarYear.fromYear(year).getLeapMonth();
  if (leap) {
    v |= leap << 12;
    const lc = LunarMonth.fromYm(year, -leap).getDayCount();
    if (lc === 30) v |= 1 << 16;
    else if (lc !== 29) throw new Error(`意外的闰月天数 ${year} 闰${leap}: ${lc}`);
  }
  return v;
}

function generate() {
  const values = [];
  for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) values.push(encodeYear(y));

  // 每行 10 个 hex，紧凑且 diff 友好
  const lines = [];
  for (let i = 0; i < values.length; i += 10) {
    lines.push('  ' + values.slice(i, i + 10).map((v) => '0x' + v.toString(16).padStart(5, '0')).join(', ') + ',');
  }

  const content = `// 由 scripts/gen-lunar-table.mjs 生成，勿手改（重新生成：node scripts/gen-lunar-table.mjs）
// ${FIRST_YEAR}-${LAST_YEAR} 农历每月天数 + 闰月位查表。目的：让客户端组件（DatePicker 等）摆脱
// lunar-javascript(299KB raw/97KB gz) 的 value-import——农历月天数只需查表，无需整库。
// 编码（每年 1 个整数）：bit0..11 = 正月..腊月是否 30 天；bit12..15 = 闰月月序(0=无闰)；bit16 = 闰月是否 30 天。

export const LUNAR_TABLE_FIRST_YEAR = ${FIRST_YEAR};
export const LUNAR_TABLE_LAST_YEAR = ${LAST_YEAR};

const TABLE: number[] = [
${lines.join('\n')}
];

/** 某农历年 month(1-12，非闰月)的天数（29/30）。表外年份/非法月回退 30，与旧 lunar-javascript 实现的兜底一致。 */
export function lunarMonthDayCount(year: number, month: number): number {
  if (year < LUNAR_TABLE_FIRST_YEAR || year > LUNAR_TABLE_LAST_YEAR || month < 1 || month > 12) return 30;
  return (TABLE[year - LUNAR_TABLE_FIRST_YEAR] >> (month - 1)) & 1 ? 30 : 29;
}

/** 某农历年的闰月月序（0=无闰或表外年份）。 */
export function lunarLeapMonth(year: number): number {
  if (year < LUNAR_TABLE_FIRST_YEAR || year > LUNAR_TABLE_LAST_YEAR) return 0;
  return (TABLE[year - LUNAR_TABLE_FIRST_YEAR] >> 12) & 0xf;
}

/** 某农历年闰月的天数（29/30）；无闰月返回 0。 */
export function lunarLeapMonthDayCount(year: number): number {
  if (lunarLeapMonth(year) === 0) return 0;
  return (TABLE[year - LUNAR_TABLE_FIRST_YEAR] >> 16) & 1 ? 30 : 29;
}
`;

  writeFileSync(OUT_PATH, content, 'utf8');
  console.log(`已生成 ${OUT_PATH}（${values.length} 年，${Buffer.byteLength(content)} 字节源码）`);
}

/** 从已生成的 TS 文件中解析表数据（对拍验证的是「实际交付」的文件，而非内存重算）。 */
function loadGeneratedTable() {
  const src = readFileSync(OUT_PATH, 'utf8');
  const m = src.match(/const TABLE: number\[\] = \[([\s\S]*?)\];/);
  if (!m) throw new Error('无法从生成文件中解析 TABLE');
  return m[1].match(/0x[0-9a-f]+/g).map((h) => parseInt(h, 16));
}

function verify() {
  const table = loadGeneratedTable();
  if (table.length !== LAST_YEAR - FIRST_YEAR + 1) {
    throw new Error(`表长度错误: ${table.length}，期望 ${LAST_YEAR - FIRST_YEAR + 1}`);
  }

  // 与生成文件中的解码逻辑保持一致
  const dayCount = (y, mo) => ((table[y - FIRST_YEAR] >> (mo - 1)) & 1 ? 30 : 29);
  const leapMonth = (y) => (table[y - FIRST_YEAR] >> 12) & 0xf;
  const leapDayCount = (y) => ((table[y - FIRST_YEAR] >> 16) & 1 ? 30 : 29);

  let checked = 0;
  let failed = 0;
  for (let i = 0; i < 200; i++) {
    const y = FIRST_YEAR + Math.floor(Math.random() * (LAST_YEAR - FIRST_YEAR + 1));
    const mo = 1 + Math.floor(Math.random() * 12);
    const expect = LunarMonth.fromYm(y, mo).getDayCount();
    const got = dayCount(y, mo);
    if (got !== expect) {
      failed++;
      console.error(`不一致: ${y}年${mo}月 查表=${got} lunar-javascript=${expect}`);
    }
    // 顺带对拍该年闰月位与闰月天数
    const expectLeap = LunarYear.fromYear(y).getLeapMonth();
    if (leapMonth(y) !== expectLeap) {
      failed++;
      console.error(`闰月位不一致: ${y}年 查表=${leapMonth(y)} lunar-javascript=${expectLeap}`);
    } else if (expectLeap && leapDayCount(y) !== LunarMonth.fromYm(y, -expectLeap).getDayCount()) {
      failed++;
      console.error(`闰月天数不一致: ${y}年闰${expectLeap}`);
    }
    checked++;
  }

  if (failed > 0) {
    console.error(`对拍失败: ${checked} 组抽样中 ${failed} 处不一致`);
    process.exit(1);
  }
  console.log(`对拍通过: 随机抽样 ${checked} 个年月（含各年闰月位/闰月天数），查表与 lunar-javascript 全部一致`);
}

if (process.argv.includes('--verify')) {
  verify();
} else {
  generate();
}
