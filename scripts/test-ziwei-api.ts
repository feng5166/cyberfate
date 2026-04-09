/**
 * 紫微斗数排盘引擎测试脚本
 * 测试用例：1983-08-21 11:52 男
 * 11:52 对应午时 (hour=6)
 *
 * 运行: npx tsx scripts/test-ziwei-api.ts
 */

import { calculateZiwei } from '../src/lib/ziwei';

const result = calculateZiwei({
  birthDate: '1983-08-21',
  birthHour: 6, // 午时 (11:00-13:00)
  gender: 'male',
});

console.log('=== 紫微斗数排盘结果 ===');
console.log(`命宫: ${result.mingGong}`);
console.log(`身宫: ${result.shenGong}`);
console.log(`五行局: ${result.wuxingJu}`);
console.log(`命主: ${result.mingzhu}`);
console.log(`身主: ${result.shenzhu}`);
console.log();

console.log('--- 四柱 ---');
console.log(`年柱: ${result.debug.yearGanZhi}`);
console.log(`月柱: ${result.debug.monthGanZhi}`);
console.log(`日柱: ${result.debug.dayGanZhi}`);
console.log(`时柱: ${result.debug.hourGanZhi}`);
console.log(`农历: ${result.debug.lunarDate}`);
console.log(`紫微星位: ${result.debug.ziweiStarBranch}`);
console.log();

console.log('--- 十二宫 ---');
for (const palace of result.palaces) {
  const markers: string[] = [];
  if (palace.isLife) markers.push('★命');
  if (palace.isBody) markers.push('★身');

  const allStars = [
    ...palace.majorStars.map(s => {
      let tag = s.name;
      if (s.brightness) tag += `(${s.brightness})`;
      if (s.sihua) tag += `[${s.sihua}]`;
      return tag;
    }),
    ...palace.auxiliaryStars.map(s => {
      let tag = s.name;
      if (s.sihua) tag += `[${s.sihua}]`;
      return tag;
    }),
    ...palace.minorStars.map(s => {
      let tag = s.name;
      if (s.brightness) tag += `(${s.brightness})`;
      if (s.sihua) tag += `[${s.sihua}]`;
      return tag;
    }),
  ];

  console.log(
    `${palace.stem}${palace.branch} ${palace.name}${markers.length ? ' ' + markers.join(' ') : ''}: ${allStars.join(' ') || '(空宫)'}`,
  );
}

console.log();
console.log('--- JSON 输出预览 (debug) ---');
console.log(JSON.stringify(result.debug, null, 2));
