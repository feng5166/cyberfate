import { calculateZiwei } from '../src/lib/ziwei/calculator';

// 测试用例：1983-08-21 11:00-12:59 （对比顺手app）
// 11:00-12:59 对应午时，索引为 6
const testCase = {
  birthDate: '1983-08-21',
  birthHour: 6,  // 午时 (11:00-13:00)
  gender: 'male' as const,
  birthPlace: { 
    longitude: 116.4, 
    latitude: 39.9 
  }
};

console.log('=== CyberFate 紫微斗数计算结果 ===');
console.log('输入:', testCase);
console.log('');

const result = calculateZiwei(testCase);

console.log('【第一步：四柱干支对比】');
console.log('年柱:', result.debug.yearGanZhi);
console.log('月柱:', result.debug.monthGanZhi);
console.log('日柱:', result.debug.dayGanZhi);
console.log('时柱:', result.debug.hourGanZhi);
console.log('');

console.log('【农历信息】');
console.log('农历日期:', result.debug.lunarDate);
console.log('农历月:', result.debug.lunarMonth);
console.log('农历日:', result.debug.lunarDay);
console.log('是否闰月:', result.debug.isLeapMonth);
console.log('');

console.log('【真太阳时修正】');
console.log('原始时辰:', testCase.birthHour, '(午时)');
console.log('修正偏移量(分钟):', result.debug.trueSolarOffset);
console.log('');

console.log('【命宫与身宫】');
console.log('命宫地支:', result.mingGong);
console.log('身宫地支:', result.shenGong);
console.log('五行局:', result.wuxingJu);
console.log('命主星:', result.mingzhu);
console.log('身主星:', result.shenzhu);
console.log('');

console.log('【十二宫完整列表】');
const palaceOrder = ['命宫', '父母', '福德', '田宅', '官禄', '仆役', '迁移', '疾厄', '财帛', '子女', '夫妻', '兄弟'] as const;
result.palaces.forEach(palace => {
  console.log(`${palace.name}(${palace.branch}): ${palace.stem}${palace.branch} - 主星: ${palace.majorStars.map(s => s.name).join('、') || '无'}`);
});
console.log('');

console.log('【全部星曜分布】');
result.palaces.forEach(palace => {
  const allStars = [
    ...palace.majorStars.map(s => s.name),
    ...palace.minorStars.map(s => s.name),
    ...palace.auxiliaryStars.map(s => s.name)
  ];
  if (allStars.length > 0) {
    console.log(`${palace.name}: ${allStars.join('、')}`);
  }
});
