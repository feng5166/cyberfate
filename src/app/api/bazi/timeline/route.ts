import { NextRequest, NextResponse } from 'next/server';
import { Solar } from 'lunar-javascript';
import { TIANGAN_WUXING } from '@/lib/bazi/constants';
import type { TianGan, WuXing } from '@/lib/bazi/types';

// ====== 十神计算 ======

const YANG_GANS = new Set<string>(['甲', '丙', '戊', '庚', '壬']);

// 五行生克关系
const SHENG_MAP: Record<string, string> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};
const KE_MAP: Record<string, string> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
};

const SHISHEN_DESC: Record<string, string> = {
  '正官': '贵人助力',
  '七煞': '冲劲竞争',
  '正印': '贵人庇护',
  '偏印': '直觉敏锐',
  '比肩': '同辈互助',
  '劫财': '竞争耗损',
  '食神': '才华展现',
  '伤官': '创意突破',
  '正财': '稳健收益',
  '偏财': '意外之财',
};

function getShiShen(dayGan: string, targetGan: string): { shishen: string; shishenDesc: string } {
  const dayWuxing = TIANGAN_WUXING[dayGan as TianGan];
  const targetWuxing = TIANGAN_WUXING[targetGan as TianGan];
  const dayIsYang = YANG_GANS.has(dayGan);
  const targetIsYang = YANG_GANS.has(targetGan);
  const samePolarity = dayIsYang === targetIsYang;

  let shishen = '';

  if (dayWuxing === targetWuxing) {
    // 同我
    shishen = samePolarity ? '比肩' : '劫财';
  } else if (SHENG_MAP[dayWuxing] === targetWuxing) {
    // 我生
    shishen = samePolarity ? '食神' : '伤官';
  } else if (SHENG_MAP[targetWuxing] === dayWuxing) {
    // 生我
    shishen = samePolarity ? '偏印' : '正印';
  } else if (KE_MAP[dayWuxing] === targetWuxing) {
    // 我克
    shishen = samePolarity ? '偏财' : '正财';
  } else if (KE_MAP[targetWuxing] === dayWuxing) {
    // 克我
    shishen = samePolarity ? '七煞' : '正官';
  }

  return {
    shishen,
    shishenDesc: SHISHEN_DESC[shishen] || '',
  };
}

// ====== 月份中文映射 ======
const MONTH_CHINESE = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

// ====== API Handler ======

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const birthDate = searchParams.get('birthDate');
    const birthHourStr = searchParams.get('birthHour');
    const gender = searchParams.get('gender');
    const targetDate = searchParams.get('targetDate');

    // Validate params
    if (!birthDate || !birthHourStr || !gender) {
      return NextResponse.json(
        { error: '缺少必要参数: birthDate, birthHour, gender' },
        { status: 400 }
      );
    }

    const birthHour = parseInt(birthHourStr);
    if (isNaN(birthHour) || birthHour < -1 || birthHour > 11) {
      return NextResponse.json({ error: '无效的 birthHour' }, { status: 400 });
    }

    if (gender !== 'male' && gender !== 'female') {
      return NextResponse.json({ error: '无效的 gender' }, { status: 400 });
    }

    // Parse dates
    const [bYear, bMonth, bDay] = birthDate.split('-').map(Number);
    if (!bYear || !bMonth || !bDay) {
      return NextResponse.json({ error: '无效的 birthDate' }, { status: 400 });
    }

    // Target date (default today in Beijing time)
    let tYear: number, tMonth: number, tDay: number;
    if (targetDate) {
      [tYear, tMonth, tDay] = targetDate.split('-').map(Number);
    } else {
      const now = new Date();
      const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      tYear = beijing.getUTCFullYear();
      tMonth = beijing.getUTCMonth() + 1;
      tDay = beijing.getUTCDate();
    }

    // Calculate EightChar
    const solar = Solar.fromYmd(bYear, bMonth, bDay);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();
    const dayGan = eightChar.getDayGan();

    // Get Yun (大运)
    const genderNum = gender === 'male' ? 1 : 0;
    const yun = eightChar.getYun(genderNum);
    const dayunRaw = yun.getDaYun();

    // Build dayun list
    interface DayunItem {
      index: number;
      ganzhi: string;
      tiangan: string;
      dizhi: string;
      shishen: string;
      shishenDesc: string;
      ageStart: number;
      ageEnd: number;
      yearStart: number;
      yearEnd: number;
      isCurrent: boolean;
    }

    const dayunList: DayunItem[] = [];
    let currentDayun: DayunItem | null = null;
    let currentDayunIndex = -1;

    for (let i = 0; i < dayunRaw.length; i++) {
      const d = dayunRaw[i];
      const ganzhi = d.getGanZhi();
      if (!ganzhi || ganzhi.length < 2) continue; // skip index 0 (childhood luck)
      
      const tiangan = ganzhi[0];
      const dizhi = ganzhi[1];
      const { shishen, shishenDesc } = getShiShen(dayGan, tiangan);
      const yearStart = d.getStartYear();
      const yearEnd = d.getEndYear();
      const isCurrent = tYear >= yearStart && tYear <= yearEnd;

      const item: DayunItem = {
        index: i,
        ganzhi,
        tiangan,
        dizhi,
        shishen,
        shishenDesc,
        ageStart: d.getStartAge(),
        ageEnd: d.getEndAge(),
        yearStart,
        yearEnd,
        isCurrent,
      };

      dayunList.push(item);
      if (isCurrent) {
        currentDayun = item;
        currentDayunIndex = i;
      }
    }

    // Build liunian list (±5 years around target year = 11 years)
    interface LiunianItem {
      year: number;
      ganzhi: string;
      tiangan: string;
      dizhi: string;
      shishen: string;
      shishenDesc: string;
      age: number;
      isCurrent: boolean;
    }

    const liunianList: LiunianItem[] = [];
    let currentLiunian: LiunianItem | null = null;

    // Collect all LiuNian from all DaYun
    const allLiunian: Array<{ year: number; ganZhi: string; age: number; lnObj: any }> = [];
    for (const d of dayunRaw) {
      try {
        const lnArr = d.getLiuNian();
        for (const ln of lnArr) {
          allLiunian.push({
            year: ln.getYear(),
            ganZhi: ln.getGanZhi(),
            age: ln.getAge(),
            lnObj: ln,
          });
        }
      } catch {
        // skip
      }
    }

    // Filter to ±5 years
    const startYear = tYear - 5;
    const endYear = tYear + 5;
    const filteredLn = allLiunian
      .filter(ln => ln.year >= startYear && ln.year <= endYear)
      .sort((a, b) => a.year - b.year);

    // Deduplicate by year
    const seenYears = new Set<number>();
    let currentLnObj: any = null;
    for (const ln of filteredLn) {
      if (seenYears.has(ln.year)) continue;
      seenYears.add(ln.year);

      const tiangan = ln.ganZhi[0];
      const dizhi = ln.ganZhi[1];
      const { shishen, shishenDesc } = getShiShen(dayGan, tiangan);
      const isCurrent = ln.year === tYear;

      const item: LiunianItem = {
        year: ln.year,
        ganzhi: ln.ganZhi,
        tiangan,
        dizhi,
        shishen,
        shishenDesc,
        age: ln.age,
        isCurrent,
      };

      liunianList.push(item);
      if (isCurrent) {
        currentLiunian = item;
        currentLnObj = ln.lnObj;
      }
    }

    // Build liuyue list
    interface LiuyueItem {
      monthChinese: string;
      ganzhi: string;
      tiangan: string;
      dizhi: string;
      shishen: string;
      shishenDesc: string;
      isCurrent: boolean;
    }

    const liuyueList: LiuyueItem[] = [];
    let currentLiuyue: LiuyueItem | null = null;

    if (currentLnObj) {
      try {
        const lyArr = currentLnObj.getLiuYue();
        
        // Determine current month: use target date's lunar month
        const targetSolar = Solar.fromYmd(tYear, tMonth, tDay);
        const targetLunar = targetSolar.getLunar();
        const currentLunarMonth = targetLunar.getMonth(); // 1-12
        // The LiuYue index is 0-based (0=正月, 1=二月, ...)
        const currentMonthIndex = currentLunarMonth - 1;

        for (let i = 0; i < lyArr.length; i++) {
          const ly = lyArr[i];
          const ganzhi = ly.getGanZhi();
          const tiangan = ganzhi[0];
          const dizhi = ganzhi[1];
          const { shishen, shishenDesc } = getShiShen(dayGan, tiangan);
          const monthChinese = ly.getMonthInChinese() + '月';
          const isCurrent = i === currentMonthIndex;

          const item: LiuyueItem = {
            monthChinese,
            ganzhi,
            tiangan,
            dizhi,
            shishen,
            shishenDesc,
            isCurrent,
          };

          liuyueList.push(item);
          if (isCurrent) {
            currentLiuyue = item;
          }
        }
      } catch {
        // liuyue calculation failed, return empty
      }
    }

    return NextResponse.json({
      dayun: { current: currentDayun, list: dayunList },
      liunian: { current: currentLiunian, list: liunianList },
      liuyue: { current: currentLiuyue, list: liuyueList },
    });
  } catch (error) {
    console.error('Timeline API error:', error);
    return NextResponse.json(
      { error: '计算失败，请稍后重试' },
      { status: 500 }
    );
  }
}
