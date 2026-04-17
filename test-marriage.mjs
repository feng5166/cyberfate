import { calculateBazi } from './src/lib/bazi/calculator.ts';

const SHENG = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
const KE = {'木':'土','土':'水','水':'火','火':'金','金':'木'};

function calcWuxingComplement(male, female) {
  let score = 8;
  for (const [element, count] of Object.entries(male)) {
    if (!['metal','wood','water','fire','earth'].includes(element)) continue;
    if (count >= 3 && female[element] <= 1) {
      const target = SHENG[element];
      if (target && female[target] >= 2) score += 3;
    }
    if (count <= 1 && female[element] >= 3) {
      const target = SHENG[element];
      if (target && male[target] >= 2) score += 3;
    }
  }
  for (const [element, count] of Object.entries(male)) {
    if (!['metal','wood','water','fire','earth'].includes(element)) continue;
    const keTarget = KE[element];
    if (keTarget && count >= 3 && female[keTarget] >= 3) score -= 4;
  }
  const keys = ['metal','wood','water','fire','earth'];
  const combined = keys.map(k => male[k] + female[k]);
  const avg = combined.reduce((a,b)=>a+b,0)/5;
  const variance = combined.reduce((s,v)=>s+(v-avg)**2,0)/5;
  if (variance <= 1.5) score += 6;
  else if (variance <= 3) score += 3;
  const mComplete = keys.every(k => male[k] > 0);
  const fComplete = keys.every(k => female[k] > 0);
  if (mComplete && fComplete) score += 4;
  else if (mComplete || fComplete) score += 2;
  return Math.max(0, Math.min(30, score));
}

const tests = [
  ['1990-05-15', '-1', '1992-08-20', '-1'],
  ['1995-03-10', '6', '1998-11-25', '8'],
  ['1988-01-01', '-1', '1995-06-15', '-1'],
  ['2000-12-12', '10', '2003-04-05', '3'],
  ['1985-07-20', '3', '1990-02-14', '7'],
];

for (const [md,mh,fh,fhd] of tests) {
  try {
    const hourMap = {'0':'子时','1':'丑时','2':'寅时','3':'卯时','4':'辰时','5':'巳时','6':'午时','7':'未时','8':'申时','9':'酉时','10':'戌时','11':'亥时','-1':'午时'};
    const mResult = calculateBazi({name:'',gender:'male',birthDate:md,birthHour:(hourMap[mh]||'午时')});
    const fResult = calculateBazi({name:'',gender:'male',birthDate:fh,birthHour:(hourMap[fhd]||'午时')});
    
    console.log(`男: ${md} 日主:${mResult.chart.day.gan}(${mResult.chart.day.ganWuxing}) 生肖:${mResult.chart.year.zhi}`);
    console.log(`  五行:`, JSON.stringify(mResult.wuxing));
    console.log(`女: ${fh} 日主:${fResult.chart.day.gan}(${fResult.chart.day.ganWuxing}) 生肖:${fResult.chart.year.zhi}`);
    console.log(`  五行:`, JSON.stringify(fResult.wuxing));
    
    const wx = calcWuxingComplement(mResult.wuxing, fResult.wuxing);
    console.log(`  => 五行互补得分: ${wx}`);
    console.log('');
  } catch(e) { console.error('Error:', e.message); }
}
