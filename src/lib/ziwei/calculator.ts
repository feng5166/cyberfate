// 紫微斗数排盘引擎 —— 三合派
//
// 算法步骤：
// 1. 公历→农历转换（lunar-javascript）
// 2. 真太阳时修正（可选）
// 3. 定命宫地支
// 4. 定身宫地支
// 5. 各宫天干（五虎遁元）
// 6. 纳音定五行局
// 7. 安紫微星（核心公式）
// 8. 安紫微星系 6 颗主星
// 9. 安天府星系 8 颗主星
// 10. 安辅星（文昌文曲、左辅右弼、天魁天钺、禄存擎羊陀罗）
// 11. 安煞星（火星铃星、地空地劫）
// 12. 安四化
// 13. 组装十二宫

import { Solar } from 'lunar-javascript';
import type {
  DiZhi, TianGan, ZiweiInput, ZiweiResult,
  PalaceInfo, StarInfo, ZiweiDebugInfo,
  Brightness, SihuaType, StarType,
} from './types';
import {
  DIZHI_LIST, TIANGAN_LIST, PALACE_NAMES,
  NAYIN_WUXINGJU, WUXINGJU_NAME, YINGAN_BY_YEARGAN,
  MINGZHU_STAR, SHENZHU_STAR,
  STAR_BRIGHTNESS, MINOR_STAR_BRIGHTNESS, EVIL_STAR_BRIGHTNESS,
  SIHUA_TABLE,
  ZIWEI_SERIES_OFFSETS, TIANFU_SERIES_OFFSETS,
  TIANKUI, TIANYUE, LUCUN,
  HUOXING_START, LINGXING_START,
} from './constants';

// ================================================================
// 工具函数
// ================================================================

function dizhiIndex(dz: DiZhi): number {
  return DIZHI_LIST.indexOf(dz);
}

export function indexToDizhi(idx: number): DiZhi {
  return DIZHI_LIST[((idx % 12) + 12) % 12];
}

function tianganIndex(tg: TianGan): number {
  return TIANGAN_LIST.indexOf(tg);
}

export function indexToTiangan(idx: number): TianGan {
  return TIANGAN_LIST[((idx % 10) + 10) % 10];
}

// ================================================================
// 步骤 2：真太阳时修正
// ================================================================

export function adjustTrueSolarTime(
  birthHour: number,
  longitude?: number,
): { adjustedHour: number; offsetMinutes: number } {
  if (longitude === undefined) {
    return { adjustedHour: birthHour, offsetMinutes: 0 };
  }
  // 以东经120°为标准时间，每度差4分钟
  const offsetMinutes = Math.round((longitude - 120) * 4);
  // 每个时辰120分钟，计算跨时辰偏移
  // birthHour 中点分钟 = birthHour * 120 + 60（子时中点00:00=60min from 23:00）
  // 简化：只在偏移超过60分钟时调整时辰
  const hourShift = Math.round(offsetMinutes / 120);
  const adjustedHour = ((birthHour + hourShift) % 12 + 12) % 12;
  return { adjustedHour, offsetMinutes };
}

// ================================================================
// 步骤 3：定命宫地支
// ================================================================

/**
 * 从寅宫起正月顺数到出生月，再从该宫起子时逆数到出生时
 *
 * monthPalaceIndex = (2 + lunarMonth - 1) % 12
 * mingGongIndex    = (monthPalaceIndex - birthHour + 12) % 12
 */
export function calcMingGong(lunarMonth: number, birthHour: number): number {
  const monthPalaceIndex = (2 + lunarMonth - 1) % 12;
  return (monthPalaceIndex - birthHour + 12) % 12;
}

// ================================================================
// 步骤 4：定身宫地支
// ================================================================

/**
 * 从寅宫起正月顺数到出生月，再从该宫起子时顺数到出生时
 */
export function calcShenGong(lunarMonth: number, birthHour: number): number {
  const monthPalaceIndex = (2 + lunarMonth - 1) % 12;
  return (monthPalaceIndex + birthHour) % 12;
}

// ================================================================
// 步骤 5：各宫天干（五虎遁元）
// ================================================================

export function getPalaceStem(yearGan: TianGan, branch: DiZhi): TianGan {
  const yinGan = YINGAN_BY_YEARGAN[yearGan];
  const yinGanIdx = tianganIndex(yinGan);
  const branchIdx = dizhiIndex(branch);
  const offset = ((branchIdx - 2) % 12 + 12) % 12;
  return indexToTiangan(yinGanIdx + offset);
}

// ================================================================
// 步骤 7：安紫微星
// ================================================================

/**
 * 三合派紫微安星公式：
 *   Q = ceil(D / J)
 *   R = Q*J - D
 *   if R==0:  offset = Q - 1
 *   if R odd: offset = Q - 1 + R
 *   if R even: offset = Q - 1 - R
 *   紫微地支索引 = (2 + offset + 1200) % 12
 */
export function calcZiweiPosition(lunarDay: number, juNumber: number): number {
  const Q = Math.ceil(lunarDay / juNumber);
  const R = Q * juNumber - lunarDay;

  let offset: number;
  if (R === 0) {
    offset = Q - 1;
  } else if (R % 2 === 1) {
    offset = Q - 1 + R;
  } else {
    offset = Q - 1 - R;
  }

  return ((2 + offset) % 12 + 12) % 12;
}

// ================================================================
// 步骤 8 & 9：安主星
// ================================================================

/**
 * 天府地支索引：与紫微关于寅宫对称
 * tianfuIndex = (4 - ziweiIndex + 12) % 12
 */
export function calcTianfuPosition(ziweiIndex: number): number {
  return (4 - ziweiIndex + 12) % 12;
}

function placeMajorStars(ziweiIndex: number): Map<number, StarInfo[]> {
  const map = new Map<number, StarInfo[]>();
  const ensure = (idx: number) => {
    const k = ((idx % 12) + 12) % 12;
    if (!map.has(k)) map.set(k, []);
    return map.get(k)!;
  };

  // 紫微星系
  for (const [name, offset] of Object.entries(ZIWEI_SERIES_OFFSETS)) {
    const idx = ((ziweiIndex + offset) % 12 + 12) % 12;
    const branch = indexToDizhi(idx);
    const brightness = STAR_BRIGHTNESS[name]?.[branch];
    ensure(idx).push({ name, type: 'major' as StarType, brightness });
  }

  // 天府星系
  const tianfuIndex = calcTianfuPosition(ziweiIndex);
  for (const [name, offset] of Object.entries(TIANFU_SERIES_OFFSETS)) {
    const idx = (tianfuIndex + offset) % 12;
    const branch = indexToDizhi(idx);
    const brightness = STAR_BRIGHTNESS[name]?.[branch];
    ensure(idx).push({ name, type: 'major' as StarType, brightness });
  }

  return map;
}

// ================================================================
// 步骤 10 & 11：安辅星和煞星
// ================================================================

interface MinorStarPlacement {
  name: string;
  index: number;
  type: StarType;
}

function placeMinorAndEvilStars(
  lunarMonth: number,
  birthHour: number,
  yearGan: TianGan,
  yearBranch: DiZhi,
): MinorStarPlacement[] {
  const result: MinorStarPlacement[] = [];

  // 左辅：辰宫起正月，顺数到出生月
  const zuofu = (4 + lunarMonth - 1) % 12;
  result.push({ name: '左辅', index: zuofu, type: 'auxiliary' });

  // 右弼：戌宫起正月，逆数到出生月
  const youbi = ((10 - (lunarMonth - 1)) % 12 + 12) % 12;
  result.push({ name: '右弼', index: youbi, type: 'auxiliary' });

  // 文昌：戌宫起子时，逆数到出生时
  const wenchang = ((10 - birthHour) % 12 + 12) % 12;
  result.push({ name: '文昌', index: wenchang, type: 'minor' });

  // 文曲：辰宫起子时，顺数到出生时
  const wenqu = (4 + birthHour) % 12;
  result.push({ name: '文曲', index: wenqu, type: 'minor' });

  // 天魁、天钺
  const tiankuiBranch = TIANKUI[yearGan];
  result.push({ name: '天魁', index: dizhiIndex(tiankuiBranch), type: 'auxiliary' });
  const tianyueBranch = TIANYUE[yearGan];
  result.push({ name: '天钺', index: dizhiIndex(tianyueBranch), type: 'auxiliary' });

  // 禄存
  const lucunBranch = LUCUN[yearGan];
  const lucunIdx = dizhiIndex(lucunBranch);
  result.push({ name: '禄存', index: lucunIdx, type: 'minor' });

  // 擎羊 = 禄存 + 1（顺时针一位）
  const qingyang = (lucunIdx + 1) % 12;
  result.push({ name: '擎羊', index: qingyang, type: 'evil' });

  // 陀罗 = 禄存 - 1（逆时针一位）
  const tuoluo = (lucunIdx - 1 + 12) % 12;
  result.push({ name: '陀罗', index: tuoluo, type: 'evil' });

  // 火星：按年支分组查起始宫，加出生时顺数
  const huoxingStart = HUOXING_START[yearBranch];
  const huoxing = (huoxingStart + birthHour) % 12;
  result.push({ name: '火星', index: huoxing, type: 'evil' });

  // 铃星：按年支分组查起始宫，加出生时顺数
  const lingxingStart = LINGXING_START[yearBranch];
  const lingxing = (lingxingStart + birthHour) % 12;
  result.push({ name: '铃星', index: lingxing, type: 'evil' });

  // 地劫：亥宫起子时，顺数到出生时
  const dijie = (11 + birthHour) % 12;
  result.push({ name: '地劫', index: dijie, type: 'evil' });

  // 地空：亥宫起子时，逆数到出生时
  const dikong = ((11 - birthHour) % 12 + 12) % 12;
  result.push({ name: '地空', index: dikong, type: 'evil' });

  return result;
}

// ================================================================
// 步骤 12：安四化
// ================================================================

function applySihua(
  yearGan: TianGan,
  palaces: PalaceInfo[],
): void {
  const sihuaForYear = SIHUA_TABLE[yearGan];

  for (const [sihua, starName] of Object.entries(sihuaForYear)) {
    for (const palace of palaces) {
      for (const list of [palace.majorStars, palace.minorStars, palace.auxiliaryStars]) {
        for (const star of list) {
          if (star.name === starName) {
            star.sihua = sihua as SihuaType;
          }
        }
      }
    }
  }
}

// ================================================================
// 主入口
// ================================================================

export function calculateZiwei(input: ZiweiInput): ZiweiResult {
  const { birthDate, birthHour: rawBirthHour, gender, birthPlace } = input;
  const [year, month, day] = birthDate.split('-').map(Number);

  if (!year || !month || !day) {
    throw new Error(`无效的出生日期: ${birthDate}`);
  }
  if (rawBirthHour < 0 || rawBirthHour > 11) {
    throw new Error(`无效的出生时辰: ${rawBirthHour}，应为 0-11`);
  }

  // ---- 步骤 1：公历→农历 ----
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const lunarMonth = Math.abs(lunar.getMonth()); // 闰月返回负数
  const lunarDay = lunar.getDay();
  const isLeapMonth = lunar.getMonth() < 0;
  const eightChar = lunar.getEightChar();

  const yearGan = eightChar.getYearGan() as TianGan;
  const yearZhi = eightChar.getYearZhi() as DiZhi;

  // ---- 步骤 2：真太阳时修正 ----
  const { adjustedHour: birthHour, offsetMinutes } = adjustTrueSolarTime(
    rawBirthHour,
    birthPlace?.longitude,
  );

  // ---- 步骤 3：定命宫 ----
  const mingGongIndex = calcMingGong(lunarMonth, birthHour);
  const mingGongBranch = indexToDizhi(mingGongIndex);

  // ---- 步骤 4：定身宫 ----
  const shenGongIndex = calcShenGong(lunarMonth, birthHour);
  const shenGongBranch = indexToDizhi(shenGongIndex);

  // ---- 步骤 5：命宫天干 ----
  const mingGongStem = getPalaceStem(yearGan, mingGongBranch);

  // ---- 步骤 6：定五行局 ----
  const ganZhi = `${mingGongStem}${mingGongBranch}`;
  const wuxingJuNumber = NAYIN_WUXINGJU[ganZhi];
  if (!wuxingJuNumber) {
    throw new Error(`纳音五行局查询失败: ${ganZhi}`);
  }
  const wuxingJuName = WUXINGJU_NAME[wuxingJuNumber];

  // ---- 步骤 7：安紫微星 ----
  const ziweiIndex = calcZiweiPosition(lunarDay, wuxingJuNumber);
  const ziweiStarBranch = indexToDizhi(ziweiIndex);

  // ---- 步骤 8 & 9：安主星 ----
  const majorStarMap = placeMajorStars(ziweiIndex);

  // ---- 步骤 10 & 11：安辅星和煞星 ----
  const minorPlacements = placeMinorAndEvilStars(lunarMonth, birthHour, yearGan, yearZhi);

  // ---- 步骤 13：组装十二宫 ----
  const palaces: PalaceInfo[] = [];
  for (let i = 0; i < 12; i++) {
    // 命宫逆时针排列
    const branchIndex = ((mingGongIndex - i) % 12 + 12) % 12;
    const branch = indexToDizhi(branchIndex);
    const stem = getPalaceStem(yearGan, branch);

    const majors = majorStarMap.get(branchIndex) ?? [];
    const minors: StarInfo[] = [];
    const auxiliaries: StarInfo[] = [];

    for (const p of minorPlacements) {
      if (p.index === branchIndex) {
        const brightnessTable =
          p.type === 'evil' ? EVIL_STAR_BRIGHTNESS :
          MINOR_STAR_BRIGHTNESS;
        const brightness = brightnessTable[p.name]?.[branch];
        const star: StarInfo = { name: p.name, type: p.type, brightness };
        if (p.type === 'auxiliary') {
          auxiliaries.push(star);
        } else {
          minors.push(star);
        }
      }
    }

    palaces.push({
      name: PALACE_NAMES[i],
      branch,
      stem,
      majorStars: majors,
      minorStars: minors,
      auxiliaryStars: auxiliaries,
      isLife: branchIndex === mingGongIndex,
      isBody: branchIndex === shenGongIndex,
    });
  }

  // ---- 步骤 12：安四化 ----
  applySihua(yearGan, palaces);

  // ---- 命主、身主 ----
  const mingzhu = MINGZHU_STAR[mingGongBranch];
  const shenzhu = SHENZHU_STAR[yearZhi];

  // ---- 时干 ----
  const dayGan = eightChar.getDayGan() as TianGan;
  const hourZhiIndex = birthHour;
  const hourZhi = indexToDizhi(hourZhiIndex);
  // 五鼠遁元求时干
  const hourGanStartMap: Record<TianGan, number> = {
    '甲': 0, '己': 0, '乙': 2, '庚': 2,
    '丙': 4, '辛': 4, '丁': 6, '壬': 6,
    '戊': 8, '癸': 8,
  };
  const hourGanIdx = (hourGanStartMap[dayGan] + hourZhiIndex) % 10;
  const hourGan = indexToTiangan(hourGanIdx);

  // ---- debug 信息 ----
  const debug: ZiweiDebugInfo = {
    solarDate: birthDate,
    lunarDate: `${lunar.getYearInChinese()}年${isLeapMonth ? '闰' : ''}${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    lunarMonth,
    lunarDay,
    isLeapMonth,
    yearGanZhi: `${yearGan}${yearZhi}`,
    monthGanZhi: `${eightChar.getMonthGan()}${eightChar.getMonthZhi()}`,
    dayGanZhi: `${eightChar.getDayGan()}${eightChar.getDayZhi()}`,
    hourGanZhi: `${hourGan}${hourZhi}`,
    trueSolarOffset: birthPlace ? offsetMinutes : undefined,
    mingGongBranch,
    shenGongBranch,
    wuxingJu: wuxingJuName,
    wuxingJuNumber,
    ziweiStarBranch,
    algorithm: 'sanhe',
  };

  return {
    palaces,
    mingGong: mingGongBranch,
    shenGong: shenGongBranch,
    mingzhu,
    shenzhu,
    wuxingJu: wuxingJuName,
    debug,
  };
}
