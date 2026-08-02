// 紫微斗数大限 / 流年引擎（PRD-ZIWEI-V2 P0-A）
//
// 大限：起限虚岁 = 五行局数（水二局 2 岁起 … 火六局 6 岁起），每限 10 年；
//       阳男阴女顺行（沿地支递增，第二限入父母宫）、阴男阳女逆行（第二限入兄弟宫）。
// 流年：当年地支定流年命宫（本命盘该地支所在宫）；当年天干查四化表得流年四化及落宫。
// 全部为本地确定性计算，零 AI 成本；替换 V1 的假线性大运（STARTING_AGE=3 模板）。

import type { DiZhi, TianGan, SihuaType } from './types';
import { DIZHI_LIST, TIANGAN_LIST, SIHUA_TABLE, WUXINGJU_NAME } from './constants';

/** 结构性宫位输入：兼容引擎 PalaceInfo（辅星独立）与前端 PalaceData（辅星并入 minors） */
export interface ZiweiPalaceLike {
  name: string;
  branch: string;
  stem?: string;
  majorStars: Array<{ name: string; brightness?: string; sihua?: string }>;
  minorStars?: Array<{ name: string; brightness?: string; sihua?: string }>;
  auxiliaryStars?: Array<{ name: string; brightness?: string; sihua?: string }>;
  isLife?: boolean;
  isBody?: boolean;
}

export interface ZiweiDayunItem {
  /** 第几限（0 起） */
  index: number;
  /** 该限所行宫位（本命盘宫名，如「官禄」） */
  palaceName: string;
  branch: DiZhi;
  stem?: string;
  /** 虚岁 */
  ageStart: number;
  ageEnd: number;
  yearStart: number;
  yearEnd: number;
  /** 该宫主星名（空宫为空数组） */
  majorStars: string[];
  isCurrent: boolean;
}

export interface ZiweiLiunianSihua {
  type: SihuaType;
  star: string;
  /** 化星落在本命盘哪个宫（星不在盘面时为 null，如文昌未安时） */
  palaceName: string | null;
}

export interface ZiweiLiunianItem {
  year: number;
  gan: TianGan;
  zhi: DiZhi;
  ganZhi: string;
  /** 流年命宫 = 当年地支所在的本命宫位 */
  palaceName: string;
  palaceBranch: DiZhi;
  majorStars: string[];
  sihua: ZiweiLiunianSihua[];
}

/** 五行局名 → 局数（「水二局」→ 2）。未识别返回 null */
export function juNumberFromName(name: string): number | null {
  for (const [num, juName] of Object.entries(WUXINGJU_NAME)) {
    if (juName === name) return Number(num);
  }
  return null;
}

/** 公历年 → 干支（1984 甲子。年度粒度展示用，不处理立春边界） */
export function yearGanZhiOf(year: number): { gan: TianGan; zhi: DiZhi } {
  const gan = TIANGAN_LIST[(((year - 4) % 10) + 10) % 10];
  const zhi = DIZHI_LIST[(((year - 4) % 12) + 12) % 12];
  return { gan, zhi };
}

/** 天干阴阳：甲丙戊庚壬为阳 */
export function isYangGan(gan: TianGan): boolean {
  return TIANGAN_LIST.indexOf(gan) % 2 === 0;
}

function findPalaceByBranch(palaces: ZiweiPalaceLike[], branch: string): ZiweiPalaceLike | null {
  return palaces.find((p) => p.branch === branch) ?? null;
}

function allStarsOf(p: ZiweiPalaceLike): Array<{ name: string; sihua?: string }> {
  return [...p.majorStars, ...(p.minorStars ?? []), ...(p.auxiliaryStars ?? [])];
}

export interface CalcDayunOptions {
  /** 生年天干（取自排盘 debug 的年干支首字，立春口径与引擎一致） */
  yearGan: TianGan;
  gender: 'male' | 'female';
  /** 出生公历年 */
  birthYear: number;
  /** 五行局数 2-6 */
  juNumber: number;
  /** 用于标记 isCurrent 的当前公历年 */
  currentYear: number;
}

/**
 * 十二大限。起限虚岁 = 局数；阳男阴女顺行（地支递增），阴男阳女逆行。
 * yearStart 按虚岁换算：虚岁 n 对应公历年 = 出生年 + n - 1。
 */
export function calcZiweiDayun(palaces: ZiweiPalaceLike[], opts: CalcDayunOptions): ZiweiDayunItem[] {
  const { yearGan, gender, birthYear, juNumber, currentYear } = opts;
  const life = palaces.find((p) => p.isLife) ?? palaces[0];
  if (!life) return [];
  const lifeBranchIdx = DIZHI_LIST.indexOf(life.branch as DiZhi);
  if (lifeBranchIdx < 0) return [];

  const forward = (isYangGan(yearGan) && gender === 'male') || (!isYangGan(yearGan) && gender === 'female');
  const items: ZiweiDayunItem[] = [];

  for (let k = 0; k < 12; k++) {
    const branchIdx = ((lifeBranchIdx + (forward ? k : -k)) % 12 + 12) % 12;
    const branch = DIZHI_LIST[branchIdx];
    const palace = findPalaceByBranch(palaces, branch);
    const ageStart = juNumber + k * 10;
    const ageEnd = ageStart + 9;
    const yearStart = birthYear + ageStart - 1;
    const yearEnd = birthYear + ageEnd - 1;
    items.push({
      index: k,
      palaceName: palace?.name ?? '—',
      branch,
      stem: palace?.stem,
      ageStart,
      ageEnd,
      yearStart,
      yearEnd,
      majorStars: (palace?.majorStars ?? []).map((s) => s.name),
      isCurrent: currentYear >= yearStart && currentYear <= yearEnd,
    });
  }
  return items;
}

/** 某公历年的流年：流年命宫 + 流年四化落宫 */
export function calcZiweiLiunian(palaces: ZiweiPalaceLike[], year: number): ZiweiLiunianItem | null {
  const { gan, zhi } = yearGanZhiOf(year);
  const palace = findPalaceByBranch(palaces, zhi);
  if (!palace) return null;

  const sihuaForYear = SIHUA_TABLE[gan];
  const sihua: ZiweiLiunianSihua[] = (Object.entries(sihuaForYear) as Array<[SihuaType, string]>).map(
    ([type, star]) => {
      const host = palaces.find((p) => allStarsOf(p).some((s) => s.name === star)) ?? null;
      return { type, star, palaceName: host?.name ?? null };
    },
  );

  return {
    year,
    gan,
    zhi,
    ganZhi: `${gan}${zhi}`,
    palaceName: palace.name,
    palaceBranch: zhi,
    majorStars: palace.majorStars.map((s) => s.name),
    sihua,
  };
}

/** 生年四化（按生年天干）各星落宫：四化叙事卡数据源 */
export function calcNatalSihua(palaces: ZiweiPalaceLike[], yearGan: TianGan): ZiweiLiunianSihua[] {
  const table = SIHUA_TABLE[yearGan];
  return (Object.entries(table) as Array<[SihuaType, string]>).map(([type, star]) => {
    const host = palaces.find((p) => allStarsOf(p).some((s) => s.name === star)) ?? null;
    return { type, star, palaceName: host?.name ?? null };
  });
}
