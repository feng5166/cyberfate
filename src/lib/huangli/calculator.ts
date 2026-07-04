// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Solar } = require('lunar-javascript');
import { TIANGAN_WUXING } from '@/lib/bazi/constants';
import type { TianGan, WuXing } from '@/lib/bazi/types';

export interface HuangliData {
  // 公历信息
  solar: string;
  solarYear: number;
  solarMonth: number;
  solarDay: number;
  weekday: string;

  // 农历信息
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  lunarMonthName: string;
  lunarDayName: string;
  lunarFull: string;
  shengxiao: string;

  // 干支
  yearGanzhi: string;
  monthGanzhi: string;
  dayGanzhi: string;
  dayGan: TianGan;
  dayZhi: string;

  // 纳音
  yearNayin: string;
  monthNayin: string;
  dayNayin: string;

  // 五行
  dayWuxing: WuXing;
  yearWuxing: WuXing;

  // 冲煞
  chong: string;
  chongDesc: string;
  chongShengxiao: string;
  sha: string;

  // 建除十二神
  zhiXing: string;

  // 宜忌
  yi: string[];
  ji: string[];

  // 神煞扩展
  taishen: string;
  pengzuGan: string;
  pengzuZhi: string;
  xiu: string;
  xiuLuck: string;
  jiShen: string[];
  xiongSha: string[];

  // 节气
  jieqi: string;
}

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

/**
 * 根据天干获取对应五行
 */
function getWuxingFromGan(gan: string): WuXing {
  return TIANGAN_WUXING[gan as TianGan] || '土';
}

/**
 * 五行颜色映射
 */
// 五行配色对齐全站唯一真源（src/data/wuxing.ts 的传统五色）。
// 注意：class 必须为字面量，Tailwind 静态扫描无法识别运行时拼接的 bg-[${..}]，故此处写死同值。
export const WUXING_COLORS: Record<WuXing, { bg: string; text: string; hex: string }> = {
  '金': { bg: 'bg-[#FBF1D0]', text: 'text-[#B0870F]', hex: '#E0A82E' },
  '木': { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', hex: '#22A366' },
  '水': { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', hex: '#3B82F6' },
  '火': { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', hex: '#E0524D' },
  '土': { bg: 'bg-[#F3E7D3]', text: 'text-[#92400E]', hex: '#9B6B3A' },
};

/**
 * 建除十二神颜色
 */
export function getZhiXingColor(zhiXing: string): { bg: string; text: string } {
  const good = ['建', '除', '满', '成', '开'];
  const bad = ['破', '危', '收', '闭'];
  if (good.includes(zhiXing)) return { bg: 'bg-green-50', text: 'text-green-700' };
  if (bad.includes(zhiXing)) return { bg: 'bg-red-50', text: 'text-red-700' };
  return { bg: 'bg-gray-50', text: 'text-gray-700' };
}

/**
 * 计算指定日期的完整黄历数据
 */
export function calculateHuangli(dateStr: string): HuangliData {
  const [year, month, day] = dateStr.split('-').map(Number);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  const d = new Date(year, month - 1, day);

  const dayGan = eightChar.getDayGan() as TianGan;
  const yearGan = eightChar.getYearGan() as TianGan;

  return {
    solar: `${year}年${month}月${day}日`,
    solarYear: year,
    solarMonth: month,
    solarDay: day,
    weekday: WEEKDAYS[d.getDay()],

    lunarYear: lunar.getYear(),
    lunarMonth: lunar.getMonth(),
    lunarDay: lunar.getDay(),
    lunarMonthName: lunar.getMonthInChinese(),
    lunarDayName: lunar.getDayInChinese(),
    lunarFull: `${eightChar.getYearGan()}${eightChar.getYearZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    shengxiao: lunar.getYearShengXiao(),

    yearGanzhi: `${eightChar.getYearGan()}${eightChar.getYearZhi()}`,
    monthGanzhi: `${eightChar.getMonthGan()}${eightChar.getMonthZhi()}`,
    dayGanzhi: `${eightChar.getDayGan()}${eightChar.getDayZhi()}`,
    dayGan,
    dayZhi: eightChar.getDayZhi(),

    yearNayin: lunar.getYearNaYin(),
    monthNayin: lunar.getMonthNaYin(),
    dayNayin: lunar.getDayNaYin(),

    dayWuxing: getWuxingFromGan(dayGan),
    yearWuxing: getWuxingFromGan(yearGan),

    chong: lunar.getDayChong(),
    chongDesc: lunar.getDayChongDesc(),
    chongShengxiao: lunar.getDayChongShengXiao(),
    sha: lunar.getDaySha(),

    zhiXing: lunar.getZhiXing(),

    yi: lunar.getDayYi() || [],
    ji: lunar.getDayJi() || [],

    taishen: lunar.getDayPositionTai(),
    pengzuGan: lunar.getPengZuGan(),
    pengzuZhi: lunar.getPengZuZhi(),
    xiu: lunar.getXiu(),
    xiuLuck: lunar.getXiuLuck(),
    jiShen: lunar.getDayJiShen() || [],
    xiongSha: lunar.getDayXiongSha() || [],

    jieqi: lunar.getCurrentJieQi()?.getName() || '',
  };
}

/**
 * 获取指定月份的所有日期农历信息（用于日历组件）
 */
export function getMonthLunarDays(year: number, month: number): { day: number; lunarDay: string; jieqi: string }[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const result: { day: number; lunarDay: string; jieqi: string }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const solar = Solar.fromYmd(year, month, d);
    const lunar = solar.getLunar();
    const lunarDay = lunar.getDayInChinese();
    const jieqi = lunar.getCurrentJieQi()?.getName() || '';
    result.push({ day: d, lunarDay: jieqi || lunarDay, jieqi });
  }

  return result;
}
