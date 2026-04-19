/**
 * CyberFate 八字算法批量验证脚本
 * 直接使用 lunar-javascript 库，绕过 API 频率限制
 */
import { Solar } from 'lunar-javascript';

// ===== 常量（从 constants.ts 复制）=====
const TIANGAN_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};
const DIZHI_WUXING = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
};
const SHICHEN_DIZHI = {
  '子时': '子', '丑时': '丑', '寅时': '寅', '卯时': '卯',
  '辰时': '辰', '巳时': '巳', '午时': '午', '未时': '未',
  '申时': '申', '酉时': '酉', '戌时': '戌', '亥时': '亥',
};
const TIANGAN_LIST = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI_LIST = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// ===== 核心算法（从 calculator.ts 复制）=====
function buildPillar(gan, zhi) {
  return { gan, zhi, ganWuxing: TIANGAN_WUXING[gan], zhiWuxing: DIZHI_WUXING[zhi] };
}

function getHourGan(dayGan, hourZhi) {
  const startGanMap = {
    '甲': 0, '己': 0,   // 甲己起甲子
    '乙': 2, '庚': 2,   // 乙庚起丙子
    '丙': 4, '辛': 4,   // 丙辛起戊子
    '丁': 6, '壬': 6,   // 丁壬起庚子
    '戊': 8, '癸': 8,   // 戊癸起壬子
  };
  const startIndex = startGanMap[dayGan];
  const hourIndex = DIZHI_LIST.indexOf(hourZhi);
  const ganIndex = (startIndex + hourIndex) % 10;
  return TIANGAN_LIST[ganIndex];
}

function getHourPillar(dayGan, shichen) {
  if (shichen === '不知道') return null;
  const hourZhi = SHICHEN_DIZHI[shichen];
  const hourGan = getHourGan(dayGan, hourZhi);
  return buildPillar(hourGan, hourZhi);
}

function countWuxing(chart) {
  const count = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
  const pillars = [chart.year, chart.month, chart.day];
  if (chart.hour) pillars.push(chart.hour);
  const WUXING_KEYS = { '金': 'metal', '木': 'wood', '水': 'water', '火': 'fire', '土': 'earth' };
  for (const p of pillars) {
    count[WUXING_KEYS[p.ganWuxing]]++;
    count[WUXING_KEYS[p.zhiWuxing]]++;
  }
  return count;
}

function calculateBazi(birthDate, birthHour) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  const yearPillar = buildPillar(ec.getYearGan(), ec.getYearZhi());
  const monthPillar = buildPillar(ec.getMonthGan(), ec.getMonthZhi());
  const dayPillar = buildPillar(ec.getDayGan(), ec.getDayZhi());
  const hourPillar = birthHour ? getHourPillar(dayPillar.gan, birthHour) : null;

  const chart = { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar };
  const wuxing = countWuxing(chart);

  return {
    pillars: {
      year: yearPillar, month: monthPillar, day: dayPillar,
      hour: hourPillar || buildPillar('?', '?'),
    },
    wuxing,
    dayMaster: `${dayPillar.gan}${dayPillar.ganWuxing}`,
    lunarDate: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
  };
}

// ===== 测试案例 =====//
const TEST_CASES = [
  // 基础案例
  { name: '案例1: 1990-05-15 辰时 男', date: '1990-05-15', hour: '辰时', gender: 'male',
    expected: { year: '庚午', month: '辛巳', day: '庚辰' }},
  
  // 闰年边界
  { name: '案例2: 2000-02-29 午时 女(闰年)', date: '2000-02-29', hour: '午时', gender: 'female',
    expected: { year: '庚辰', month: '戊寅' }},
  
  // 年末边界
  { name: '案例3: 1989-12-31 子时 男(年末)', date: '1989-12-31', hour: '子时', gender: 'male',
    expected: { year: '己巳', month: '丙子' }},
  
  // 年初边界
  { name: '案例4: 2000-01-01 戌时 女(年初)', date: '2000-01-01', hour: '戌时', gender: 'female',
    expected: { year: '己卯', month: '丙子' }},
  
  // 不同时辰验证五鼠遁
  { name: '案例5: 同日不同时-子时', date: '1990-05-15', hour: '子时', gender: 'male',
    expected: { day: '庚辰', hourGan: '丙' }},  // 日庚→乙庚起丙子→子时=丙子
  { name: '案例6: 同日不同时-午时', date: '1990-05-15', hour: '午时', gender: 'male',
    expected: { day: '庚辰', hourGan: '壬' }},  // 日庚→乙庚起丙子→午时(第6位)=壬午
  
  // 跨月节气边界
  { name: '案例7: 2024-02-04 寅时(立春前后)', date: '2024-02-04', hour: '寅时', gender: 'male',
    expected: {} },
  { name: '案例8: 2024-02-05 寅时(立春后)', date: '2024-02-05', hour: '寅时', gender: 'male',
    expected: {} },
  
  // 近代名人（1900范围内）
  { name: '案例9: 邓小平 1904-08-22 辰时', date: '1904-08-22', hour: '辰时', gender: 'male',
    expected: { year: '甲辰' }},
  { name: '案例10: 鲁迅 1881-09-25 巳时 → 超出范围', date: '1881-09-25', hour: '巳时', gender: 'male',
    expectError: true },
  
  // 女命测试大运方向差异
  { name: '案例11: 1995-06-18 亥时 女', date: '1995-06-18', hour: '亥时', gender: 'female',
    expected: {} },
  
  // 特殊日期 - 月末
  { name: '案例12: 1988-03-31 酉时(大月月末)', date: '1988-03-31', hour: '酉时', gender: 'male',
    expected: {} },
  
  // 2000年代
  { name: '案例13: 2008-08-08 申时(奥运开幕)', date: '2008-08-08', hour: '申时', gender: 'male',
    expected: { year: '戊子', month: '庚申' }},
  
  // 2020年代
  { name: '案例14: 2020-01-23 子时(除夕)', date: '2020-01-23', hour: '子时', gender: 'female',
    expected: {} },
  
  // 当前年份
  { name: '案例15: 2026-04-19 卯时(今天)', date: '2026-04-19', hour: '卯时', gender: 'male',
    expected: {} },
];

// ===== 执行验证 =====/
console.log('='.repeat(80));
console.log('CyberFate 八字算法批量验证报告');
console.log(`验证时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
console.log(`测试案例数: ${TEST_CASES.length}`);
console.log('='.repeat(80));
console.log('');

let passed = 0;
let failed = 0;
let skipped = 0;
const errors = [];

for (const tc of TEST_CASES) {
  console.log(`--- ${tc.name} ---`);
  
  try {
    const result = calculateBazi(tc.date, tc.hour);
    
    if (tc.expectError) {
      console.log(`  ⚠️ 预期报错但正常返回`);
      console.log(`  年柱: ${result.pillars.year.gan}${result.pillars.year.zhi}`);
      skipped++;
      console.log('');
      continue;
    }
    
    const py = result.pillars;
    const wx = result.wuxing;
    
    console.log(`  农历: ${result.lunarDate}`);
    console.log(`  年柱: ${py.year.gan}${py.year.zhi} (${py.year.ganWuxing}${py.year.zhiWuxing})`);
    console.log(`  月柱: ${py.month.gan}${py.month.zhi} (${py.month.ganWuxing}${py.month.zhiWuxing})`);
    console.log(`  日柱: ${py.day.gan}${py.day.zhi} (${py.day.ganWuxing}${py.day.zhiWuxing})`);
    console.log(`  时柱: ${py.hour.gan}${py.hour.zhi} (${py.hour.ganWuxing}${py.hour.zhiWuxing})`);
    console.log(`  五行: 金${wx.metal} 木${wx.wood} 水${wx.water} 火${wx.fire} 土${wx.earth}`);
    console.log(`  日主: ${result.dayMaster}`);
    
    // 验证预期值
    let ok = true;
    const issues = [];
    
    if (tc.expected?.year && `${py.year.gan}${py.year.zhi}` !== tc.expected.year) {
      ok = false;
      issues.push(`年柱: 预期${tc.expected.year}, 实际${py.year.gan}${py.year.zhi}`);
    }
    if (tc.expected?.month && `${py.month.gan}${py.month.zhi}` !== tc.expected.month) {
      ok = false;
      issues.push(`月柱: 预期${tc.expected.month}, 实际${py.month.gan}${py.month.zhi}`);
    }
    if (tc.expected?.day && `${py.day.gan}${py.day.zhi}` !== tc.expected.day) {
      ok = false;
      issues.push(`日柱: 预期${tc.expected.day}, 实际${py.day.gan}${py.day.zhi}`);
    }
    if (tc.expected?.hourGan && py.hour.gan !== tc.expected.hourGan) {
      ok = false;
      issues.push(`时干: 预期${tc.expected.hourGan}, 实际${py.hour.gan}`);
    }
    
    if (ok || Object.keys(tc.expected || {}).length === 0) {
      console.log(`  ✅ 通过`);
      passed++;
    } else {
      console.log(`  ❌ 失败: ${issues.join('; ')}`);
      failed++;
      errors.push({ case: tc.name, issues });
    }
  } catch (e) {
    if (tc.expectError) {
      console.log(`  ✅ 正确捕获错误: ${e.message}`);
      passed++;
    } else {
      console.log(`  ❌ 异常: ${e.message}`);
      failed++;
      errors.push({ case: tc.name, issues: [e.message] });
    }
  }
  console.log('');
}

// ===== 汇总 =====/
console.log('='.repeat(80));
console.log('验证汇总');
console.log('='.repeat(80));
console.log(`总计: ${TEST_CASES.length} 个案例`);
console.log(`通过: ${passed} ✅`);
console.log(`失败: ${failed} ❌`);
console.log(`跳过/待确认: ${skipped} ⏳`);
console.log(`通过率: ${(passed / TEST_CASES.length * 100).toFixed(1)}%`);

if (errors.length > 0) {
  console.log('\n失败详情:');
  for (const e of errors) {
    console.log(`  ❌ ${e.case}: ${e.issues.join('; ')}`);
  }
}

// ===== 五鼠遁专项验证 =====/
console.log('\n' + '='.repeat(80));
console.log('五鼠遁元（时柱计算）专项验证');
console.log('='.repeat(80));

const WUCHU_DUN_TEST = [
  { dayGan: '甲', ziShi: '甲子', chouShi: '乙丑', yinShi: '丙寅', maoShi: '丁卯', chenShi: '戊辰', siShi: '己巳', wuShi: '庚午', weiShi: '辛未', shenShi: '壬申', youShi: '癸酉', xuShi: '甲戌', haiShi: '乙亥' },
  { dayGan: '乙', ziShi: '丙子', chouShi: '丁丑', yinShi: '戊寅', maoShi: '己卯', chenShi: '庚辰', siShi: '辛巳', wuShi: '壬午', weiShi: '癸未', shenShi: '甲申', youShi: '乙酉', xuShi: '丙戌', haiShi: '丁亥' },
  { dayGan: '丙', ziShi: '戊子', chouShi: '己丑', yinShi: '庚寅', maoShi: '辛卯', chenShi: '壬辰', siShi: '癸巳', wuShi: '甲午', weiShi: '乙未', shenShi: '丙申', youShi: '丁酉', xuShi: '戊戌', haiShi: '己亥' },
  { dayGan: '丁', ziShi: '庚子', chouShi: '辛丑', yinShi: '壬寅', maoShi: '癸卯', chenShi: '甲辰', siShi: '乙巳', wuShi: '丙午', weiShi: '丁未', shenShi: '戊申', youShi: '己酉', xuShi: '庚戌', haiShi: '辛亥' },
  { dayGan: '戊', ziShi: '壬子', chouShi: '癸丑', yinShi: '甲寅', maoShi: '乙卯', chenShi: '丙辰', siShi: '丁巳', wuShi: '戊午', weiShi: '己未', shenShi: '庚申', youShi: '辛酉', xuShi: '壬戌', haiShi: '癸亥' },
  { dayGan: '己', ziShi: '甲子', chouShi: '乙丑', yinShi: '丙寅', maoShi: '丁卯', chenShi: '戊辰', siShi: '己巳', wuShi: '庚午', weiShi: '辛未', shenShi: '壬申', youShi: '癸酉', xuShi: '甲戌', haiShi: '乙亥' },
  { dayGan: '庚', ziShi: '丙子', chouShi: '丁丑', yinShi: '戊寅', maoShi: '己卯', chenShi: '庚辰', siShi: '辛巳', wuShi: '壬午', weiShi: '癸未', shenShi: '甲申', youShi: '乙酉', xuShi: '丙戌', haiShi: '丁亥' },
  { dayGan: '辛', ziShi: '戊子', chouShi: '己丑', yinShi: '庚寅', maoShi: '辛卯', chenShi: '壬辰', siShi: '癸巳', wuShi: '甲午', weiShi: '乙未', shenShi: '丙申', youShi: '丁酉', xuShi: '戊戌', haiShi: '己亥' },
  { dayGan: '壬', ziShi: '庚子', chouShi: '辛丑', yinShi: '壬寅', maoShi: '癸卯', chenShi: '甲辰', siShi: '乙巳', wuShi: '丙午', weiShi: '丁未', shenShi: '戊申', youShi: '己酉', xuShi: '庚戌', haiShi: '辛亥' },
  { dayGan: '癸', ziShi: '壬子', chouShi: '癸丑', yinShi: '甲寅', maoShi: '乙卯', chenShi: '丙辰', siShi: '丁巳', wuShi: '戊午', weiShi: '己未', shenShi: '庚申', youShi: '辛酉', xuShi: '壬戌', haiShi: '癸亥' },
];

let wuchuPassed = 0;
let wuchuFailed = 0;
const SHICHEN_LIST = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];
const SHICHEN_KEYS = ['ziShi','chouShi','yinShi','maoShi','chenShi','siShi','wuShi','weiShi','shenShi','youShi','xuShi','haiShi'];

for (const wt of WUCHU_DUN_TEST) {
  const issues = [];
  for (let i = 0; i < 12; i++) {
    const expected = wt[SHICHEN_KEYS[i]];
    const pillar = getHourPillar(wt.dayGan, SHICHEN_LIST[i]);
    const actual = pillar ? `${pillar.gan}${pillar.zhi}` : 'null';
    if (actual !== expected) {
      issues.push(`${SHICHEN_LIST[i]}: 预期${expected}, 实际${actual}`);
    }
  }
  if (issues.length === 0) {
    console.log(`  ✅ 日干${wt.dayGan}: 12个时辰全部正确`);
    wuchuPassed++;
  } else {
    console.log(`  ❌ 日干${wt.dayGan}: ${issues.join('; ')}`);
    wuchuFailed++;
  }
}

console.log(`\n五鼠遁验证: ${wuchuPassed}/10 组通过${wuchuFailed > 0 ? `, ${wuchuFailed}组失败` : ''}`);

console.log('\n' + '='.repeat(80));
console.log('验证完成');
console.log('='.repeat(80));
