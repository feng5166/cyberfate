/**
 * 人生K线的「纯展示派生」——只吃 computeLifeKline 已经算好的 LifeKlineResult，
 * 不碰任何历法计算。
 *
 * 为什么单独成文件：lifeKline.ts 顶部 `import { Lunar, Solar } from 'lunar-javascript'`，
 * 客户端只要 value-import 它一个函数，就会把整库（299KB raw / 97KB gz，CJS 不可 tree-shake）
 * 拖进首屏。这两个函数纯粹是对 result 做筛选与拼文案，没有理由为它们付这个代价。
 * 客户端一律从本文件引；服务端从哪引都行（它本来就有 lunar）。
 */
import type { LifeKlineResult, LifeKlineYearPoint } from './lifeKline';

const BACKTEST_MIN_AGE = 18;
/** 虚岁低于此值不出回测模块（可回忆区间太短） */
const BACKTEST_MIN_CURRENT_AGE = 20;

export interface BacktestPick {
  peak: LifeKlineYearPoint;
  trough: LifeKlineYearPoint;
}

/**
 * 从用户已经历的区间（虚岁 [18, 当前-1]）选收盘最高与最低各一年。
 * 两年相隔 ≤2 年时低分年取次低，保证回忆能拉开；选不出两个不同年份返回 null。
 */
export function selectBacktestYears(result: LifeKlineResult): BacktestPick | null {
  const { currentAge } = result.summary;
  if (currentAge === null || currentAge < BACKTEST_MIN_CURRENT_AGE) return null;

  const past = result.points.filter((p) => p.age >= BACKTEST_MIN_AGE && p.age <= currentAge - 1);
  if (past.length < 2) return null;

  const peak = past.reduce((a, b) => (b.close > a.close ? b : a));
  const ascending = [...past].sort((a, b) => a.close - b.close);
  const trough = ascending.find((p) => Math.abs(p.year - peak.year) > 2) ?? ascending[0];
  if (trough.age === peak.age) return null;

  return { peak, trough };
}

export function buildNarrative(result: LifeKlineResult): string[] {
  const { meta, summary, points, dayuns } = result;
  const out: string[] = [];

  out.push(
    `你是${meta.dayMaster}命，${meta.mingGe.geju}、日主${meta.mingGe.rizhuStrength}，喜${meta.mingGe.yongShen}而忌${meta.mingGe.jiShen}——这是这条K线与生俱来的底色。`,
  );

  const ca = summary.currentAge;
  if (ca === null) {
    out.push(
      `纵观百年，${summary.bestDecade.ageStart}-${summary.bestDecade.ageEnd} 岁是平均最高的十年，${summary.peak.year} 年（${summary.peak.age}岁）为全程巅峰。`,
    );
    return out;
  }

  const past = points.filter((p) => p.age >= 10 && p.age < ca);
  if (past.length >= 3) {
    const pastPeak = past.reduce((a, b) => (b.close > a.close ? b : a));
    out.push(`回望来路，${pastPeak.year} 年（${pastPeak.age}岁）是你已经走过的一段高点——${pastPeak.comment}。`);
  }

  const curDayun = dayuns.find((d) => d.isCurrent);
  if (curDayun) {
    const left = Math.max(1, curDayun.ageEnd - ca + 1);
    out.push(
      `此刻你行至 ${curDayun.ganZhi} 大运（${curDayun.tenGod}），整体处于${summary.currentPhase}，这步大运还余约 ${left} 年。`,
    );
  } else {
    out.push(`此刻你整体处于${summary.currentPhase}。`);
  }

  const nextRise = points.find((p) => p.age > ca && (p.level === '上佳' || p.level === '极盛'));
  if (nextRise) {
    const bestAhead = summary.bestDecade.ageStart > ca;
    out.push(
      `往前看，下一段明显的上坡从 ${nextRise.year} 年（${nextRise.age}岁）铺开${
        bestAhead ? `，而你的最佳十年（${summary.bestDecade.ageStart}-${summary.bestDecade.ageEnd}岁）尚未到来` : '，届时宜乘势而上'
      }。`,
    );
  } else {
    out.push(
      `往前看，${summary.bestDecade.ageStart}-${summary.bestDecade.ageEnd} 岁是全程平均最高的十年，眼下宜蓄势打底。`,
    );
  }

  return out;
}
