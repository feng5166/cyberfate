const { Solar, Lunar } = require('lunar-javascript');

function pad(n){return String(n).padStart(2,'0');}
function lunarToSolarYmd(date){
  const [y,m,d]=date.split('-').map(Number);
  const s=Lunar.fromYmd(y,m,d).getSolar();
  return `${s.getYear()}-${pad(s.getMonth())}-${pad(s.getDay())}`;
}
function buildEightChar(birthDate, h, mi){
  const [y,m,d]=birthDate.split('-').map(Number);
  const solar = typeof h==='number' ? Solar.fromYmdHms(y,m,d,h,typeof mi==='number'?mi:0,0) : Solar.fromYmd(y,m,d);
  return solar.getLunar().getEightChar();
}
function pillars(ec){
  return `${ec.getYear()} / ${ec.getMonth()} / ${ec.getDay()} / ${ec.getTime()}`;
}
function dayunList(ec, genderNum){
  const yun = ec.getYun(genderNum);
  const raw = yun.getDaYun();
  return raw.filter(d=>{const gz=d.getGanZhi&&d.getGanZhi();return typeof gz==='string'&&gz.length>=2;});
}
function report(label, dateStr, isLunar, h, mi, genderNum){
  const solarStr = isLunar ? lunarToSolarYmd(dateStr) : dateStr;
  console.log(`\n### ${label}`);
  console.log(`input=${dateStr} isLunar=${isLunar} -> solar=${solarStr} hour=${h}`);
  // calculateBazi 口径：四柱
  const ecChart = buildEightChar(solarStr, h, mi);
  console.log(`  四柱(公历锚点, hour=${h}): ${pillars(ecChart)}`);
  // 修复后：大运用 solarStr
  const dl = dayunList(buildEightChar(solarStr, h, mi), genderNum);
  console.log(`  修复后大运首3: ${dl.slice(0,3).map(d=>`${d.getGanZhi()}@${d.getStartYear()}(${d.getStartAge()}岁)`).join(' ')}`);
  if (isLunar){
    const ecWrong = buildEightChar(dateStr, h, mi);
    console.log(`  [修复前] 农历原串当公历四柱: ${pillars(ecWrong)}`);
    const dw = dayunList(ecWrong, genderNum);
    console.log(`  [修复前] 大运首3: ${dw.slice(0,3).map(d=>`${d.getGanZhi()}@${d.getStartYear()}(${d.getStartAge()}岁)`).join(' ')}`);
  }
}

// 1. 农历 1990-06-15 男
report('农历1990-06-15 男 (无精确时刻)','1990-06-15',true,undefined,undefined,1);
// 2. 农历 1990-01-15 男
report('农历1990-01-15 男','1990-01-15',true,undefined,undefined,1);
// 3. 1990-02-04 亥时男 粗时辰 -> undefined hour (修复实现)
report('公历1990-02-04 亥时男 [粗时辰: hour=undefined]','1990-02-04',false,undefined,undefined,1);
// 错误实现：传时辰起始小时 21
report('公历1990-02-04 亥时男 [错误实现: hour=21]','1990-02-04',false,21,0,1);
// 4. 1990-06-06 亥时男
report('公历1990-06-06 亥时男 [hour=undefined]','1990-06-06',false,undefined,undefined,1);
report('公历1990-06-06 亥时男 [hour=21]','1990-06-06',false,21,0,1);
