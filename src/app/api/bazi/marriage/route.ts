import crypto from 'crypto';
import { NextRequest, NextResponse, after } from 'next/server';
import { getAuthSession } from '@/lib/auth-session';
import { getCache, setCache } from '@/lib/ai/cache';
import { sanitizeUserInput } from '@/lib/utils/sanitize';

import { calculateBazi as realCalculateBazi } from '@/lib/bazi';
import { PRIMARY_MODEL, FALLBACK_MODEL } from '@/lib/ai/models';
import { getPrimaryProvider, type ResolvedProvider } from '@/lib/ai/provider';
import {
  calcSideShishen,
  buildShishenSummary,
  type SideShishen,
  type ShishenSummary,
} from '@/lib/marriage/shishen';

// ── AI 缓存参数 ─────────────────────────────────────
// 键版本集中在此：prompt/输出结构一变就改版本号，旧缓存自然失效，不必手动清库。
// v1→v2 / v4→v5：键材料从「只有双方八字」换成「整包 prompt 输入的摘要」，修跨用户串档（见 structCacheKey 注释）。
// 旧键与新键形状不同，天然读不到，剩余条目按各自 TTL（≤90 天）自然过期，无需手动清库。
const MARRIAGE_STRUCT_CACHE_PREFIX = 'marriage:ai:struct:v2';
const MARRIAGE_DEEP_CACHE_PREFIX = 'marriage:ai:deep:v5';
// 合婚结果按双方八字定型、终身不变，但仍给 90 天 TTL：
// 原来 set 不带 TTL 会让 Redis 里的长文报告只增不减，最终撑爆内存配额
const MARRIAGE_CACHE_TTL = 90 * 24 * 60 * 60;
// 半降级结果（模型有输出但结构没解析出来）的短 TTL：只用来挡住同一瞬间的重复调用，
// 不让一份退化文案在缓存里躺 90 天。见 runAIAnalysis 末尾的分级写入
const MARRIAGE_DEGRADED_CACHE_TTL = 120;
// 深度报告的两级长度门槛，必须与「读缓存」侧同源，否则会出现死区：
// - DEEP_REPORT_MIN_READ_LEN：读缓存时认为「这份缓存还能用」的下限。短于它的直接当没缓存。
// - DEEP_REPORT_FULL_CACHE_LEN：prompt 要求 1200-1800 字，短于它多半是上游断流/被 max_tokens
//   截断的残报告，不配占住 90 天缓存位。
// 两者之间（200~600 字）既不能不存也不该长存：曾经写入阈值 600、读取阈值 200，这段区间
// 「读得进、写不出」——每个请求都判定未命中并重新调一次 AI，缓存永远建不起来。
// 现在这段落 120s 短 TTL：足够挡住同一瞬间的重复调用防雪崩，到期后自然重算去拿完整报告。
const DEEP_REPORT_MIN_READ_LEN = 200;
const DEEP_REPORT_FULL_CACHE_LEN = 600;
const DEEP_REPORT_SHORT_CACHE_TTL = 120;

/** 按报告长度决定缓存 TTL；返回 0 表示短到不值得缓存 */
function deepReportCacheTtl(text: string): number {
  if (text.length > DEEP_REPORT_FULL_CACHE_LEN) return MARRIAGE_CACHE_TTL;
  if (text.length > DEEP_REPORT_MIN_READ_LEN) return DEEP_REPORT_SHORT_CACHE_TTL;
  return 0;
}

// ── 缓存键 ─────────────────────────────────────────
/**
 * 合婚缓存键 = 前缀 + 「所有会进 prompt 的输入」的 sha256 摘要。
 *
 * 为什么必须这么改（这是隐私问题，不只是命中率问题）：
 * 旧键只有 { male: 八字, female: 八字 }，可姓名、出生地、公历/农历标记全都进了 prompt，
 * 也就原样进了缓存正文——深度报告开头就是「男方：张三，生于…」，struct 的 analysis/highlight
 * 同样可能带名。于是两对生辰完全相同（同年月日时）但姓名不同的情侣命中同一份缓存，
 * 后来者读到的报告里写着前一对的真实姓名。八字是六十甲子循环，相隔 60 年的两个人四柱可以完全一致，
 * 「同八字不同人」在生产里并不罕见，这就是一条跨用户的个人信息泄露路径。
 *
 * 为什么摘要而不是把姓名明文拼进键：姓名/出生地是 PII，而 Redis 键空间在控制台、SCAN、
 * 慢日志里都是明文可见的。做法对齐 src/app/api/bazi/route.ts 的 `v6:bazi:<sha256>`。
 *
 * 为什么收成两个构造函数而不是各处直接拼：深度报告有两个调用点（SSE 分支与 runDeepReport），
 * 键材料一旦写岔就是「谁也读不到谁写的」的静默失效，比串档更难发现。
 */
function digestCacheKey(prefix: string, material: Record<string, unknown>): string {
  const digest = crypto.createHash('sha256')
    .update(JSON.stringify(material))
    .digest('hex')
    .slice(0, 24);
  return `${prefix}:${digest}`;
}

function structCacheKey(p: {
  maleBazi: string; femaleBazi: string;
  maleName: string; femaleName: string;
  maleDateLine: string; femaleDateLine: string;
  malePlaceLine: string; femalePlaceLine: string;
  score: number; level: string; details: string[];
}): string {
  return digestCacheKey(MARRIAGE_STRUCT_CACHE_PREFIX, {
    m: p.maleBazi, f: p.femaleBazi,
    // 姓名进 prompt、也进正文 → 必须进键，否则同八字不同姓名的两对会互相读到对方的名字
    mn: p.maleName, fn: p.femaleName,
    // 出生地同理；出生日期也必须进：同一副八字对应的公历日期每 60 年重复一次，
    // 而 prompt 里写着「生于 X 年 X 月 X 日」，旧键会让 1965 年生的人读到 2025 年生的人的报告
    md: p.maleDateLine, fd: p.femaleDateLine,
    mp: p.malePlaceLine, fp: p.femalePlaceLine,
    // score/level/details 理论上可由双方八字推出（冗余），仍纳入：算分逻辑一改键就自然翻新，
    // 不会留下「新算法的分数配旧文案」的错配
    s: p.score, lv: p.level, d: p.details.join('|'),
  });
}

function deepCacheKey(p: {
  maleBazi: string; femaleBazi: string;
  maleName: string; femaleName: string;
  maleDateLine: string; femaleDateLine: string;
  score: number; level: string;
}): string {
  return digestCacheKey(MARRIAGE_DEEP_CACHE_PREFIX, {
    m: p.maleBazi, f: p.femaleBazi,
    mn: p.maleName, fn: p.femaleName,
    md: p.maleDateLine, fd: p.femaleDateLine,
    s: p.score, lv: p.level,
    // 深度报告 prompt 里写死了「今年及未来 2-3 年」的流年节点。TTL 长达 90 天，
    // 年份不进键的话，12 月生成的报告能被次年 3 月的用户读到，流年结论整体错一年。
    // 代价是每年元旦这批缓存集体翻新一次——本来 90 天也留不住，可接受。
    y: new Date().getFullYear(),
  });
}

/**
 * 写缓存挪到响应之后再执行。
 *
 * 为什么：AI 调用要等 10~60s，而 Node 内建 undici 连接池的 keepAliveTimeout 默认只有 4s——
 * 等模型吐完时，到 Upstash 的那条连接必然已经凉了，紧接着这一次 Redis 写要重新做 TCP+TLS 握手，
 * 生产实测约 268ms，全额计入用户等待。而写缓存的收益是给下一个人的，没道理让这一个人替他等。
 * after() 在 Vercel 上映射到 waitUntil：响应关闭后仍保证执行，不像游离 Promise 会被冻结的实例丢掉
 * （缓存写不进去 ⇒ 90 天缓存事实上不可达、每次都重打模型）。
 * 拿不到 waitUntil 的运行时里 after() 会同步抛错：退回内联 await，至少不比改造前差。
 */
async function writeCacheAfterResponse(key: string, value: unknown, ttl: number): Promise<void> {
  // setCache 内部已吞异常，这里再兜一层：after() 里的未处理拒绝会污染整个调用
  const write = () => setCache(key, value, ttl).catch((err) => {
    console.warn('[marriage] cache write failed:', err instanceof Error ? err.message : err);
  });
  try {
    after(write);
  } catch (err) {
    console.warn('[marriage] after() unavailable, write cache inline:', err instanceof Error ? err.message : err);
    await write();
  }
}

// ── 八字计算 ───────────────────────────────────────

interface WuxingCount { metal: number; wood: number; water: number; fire: number; earth: number; }
interface Pillar { gan: string; zhi: string; ganWuxing: string; zhiWuxing: string; }
interface BaziChart { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null; }

interface BaziInfo {
  birthDate: string;
  birthHour: string;
  chart: BaziChart;
  wuxing: WuxingCount;
  dayMaster: string;
  zodiac: string;
  dayMasterGan: string;
  dayMasterWuxing: string;
  yearZhi: string;
  shishen: SideShishen;
  shishenSummary: ShishenSummary;
}

interface SidePayload {
  name?: string;
  gender?: 'male' | 'female';
  isLunar?: boolean;
  birthDate?: string;
  knowTime?: boolean;
  birthHourNum?: number;
  birthMinute?: number;
  lateZiShi?: boolean;
  birthPlace?: string;
}

function calculateFullBazi(
  birthDate: string,
  birthHour: string,
  side?: SidePayload
): BaziInfo {
  const hourMap: Record<string, string> = {
    '0': '子时', '1': '丑时', '2': '寅时', '3': '卯时',
    '4': '辰时', '5': '巳时', '6': '午时', '7': '未时',
    '8': '申时', '9': '酉时', '10': '戌时', '11': '亥时',
    '-1': '午时',
    '子时': '子时', '丑时': '丑时', '寅时': '寅时', '卯时': '卯时',
    '辰时': '辰时', '巳时': '巳时', '午时': '午时', '未时': '未时',
    '申时': '申时', '酉时': '酉时', '戌时': '戌时', '亥时': '亥时',
    '不知道': '午时',
  };

  const hasPrecise =
    side?.knowTime !== false && typeof side?.birthHourNum === 'number';

  const calcInput: any = {
    name: side?.name || '',
    gender: side?.gender || 'male',
    birthDate,
  };

  if (side?.isLunar === true) {
    calcInput.isLunar = true;
  }

  if (side?.knowTime === false) {
    calcInput.knowTime = false;
    calcInput.birthHour = '不知道';
  } else if (hasPrecise) {
    calcInput.knowTime = true;
    calcInput.birthHourNum = side?.birthHourNum;
    calcInput.birthMinute = typeof side?.birthMinute === 'number' ? side.birthMinute : 0;
    if (side?.lateZiShi === true) calcInput.lateZiShi = true;
  } else {
    calcInput.birthHour = hourMap[birthHour] || '午时';
  }

  const result = realCalculateBazi(calcInput);
  const shishen = calcSideShishen(result.chart);
  const shishenSummary = buildShishenSummary(shishen);

  return {
    birthDate,
    birthHour,
    chart: result.chart,
    wuxing: result.wuxing,
    dayMaster: result.dayMaster,
    zodiac: result.zodiac,
    dayMasterGan: result.chart.day.gan,
    dayMasterWuxing: result.chart.day.ganWuxing,
    yearZhi: result.chart.year.zhi,
    shishen,
    shishenSummary,
  };
}

function formatBazi(info: BaziInfo): string {
  const { chart } = info;
  const h = chart.hour ? `${chart.hour.gan}${chart.hour.zhi}` : '?';
  return `${chart.year.gan}${chart.year.zhi}年 ${chart.month.gan}${chart.month.zhi}月 ${chart.day.gan}${chart.day.zhi}日 ${h}时`;
}

function buildSideExport(name: string, gender: 'male' | 'female', info: BaziInfo) {
  return {
    name,
    gender,
    zodiac: info.zodiac,
    dayMaster: info.dayMaster,
    pillars: info.chart,
    wuxing: info.wuxing,
    shishen: info.shishen,
    shishenSummary: info.shishenSummary,
    bazi: formatBazi(info),
  };
}

// ═══════════════════════════════════════════════════
// 常量定义（合婚算法）
// ═══════════════════════════════════════════════════

const WX_SHENG: Record<string, string> = { '木':'火','火':'土','土':'金','金':'水','水':'木' };
const WX_KE: Record<string, string>   = { '木':'土','土':'水','水':'火','火':'金','金':'木' };

const GAN_TO_WX: Record<string, string> = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
const CN_TO_WX: Record<string, keyof WuxingCount> = { '金':'metal','木':'wood','水':'water','火':'fire','土':'earth' };

const WUHE: Record<string, string> = { '甲':'己','乙':'庚','丙':'辛','丁':'壬','戊':'癸','己':'甲','庚':'乙','辛':'丙','壬':'丁','癸':'戊' };
const YIN_GAN = new Set(['乙','丁','己','辛','癸']);

const LIUHE: Record<string, string> = { '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午' };
const SANHE: Record<string, string[]> = { '申':['子','辰'],'子':['申','辰'],'辰':['申','子'],'寅':['午','戌'],'午':['寅','戌'],'戌':['寅','午'],'巳':['酉'],'酉':['巳'],'亥':['卯','未'],'卯':['亥','未'],'未':['亥','卯'] };
const LIUCHONG: Record<string, string> = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };
const LIUHAI: Record<string, string> = { '子':'未','未':'子','丑':'午','午':'丑','寅':'亥','亥':'寅','辰':'酉','酉':'辰','戌':'卯','卯':'戌' };

const GUIREN: Record<string, string[]> = {
  '甲':['丑','未'],'乙':['子','申'],'丙':['亥','酉'],'丁':['亥','酉'],
  '戊':['丑','未'],'己':['子','申'],'庚':['丑','未'],'辛':['寅','午'],
  '壬':['卯','巳'],'癸':['卯','巳'],
};

interface ScoreResult { score: number; desc: string; }

function calculateScore(male: BaziInfo, female: BaziInfo) {
  const details: string[] = [];

  const wuxingScore = calcWuxingComplement(male.wuxing, female.wuxing);
  details.push(`五行互补：${wuxingScore.desc} (+${wuxingScore.score}分)`);

  const ganScore = calcDayMasterRelation(male.dayMasterGan, male.dayMasterWuxing, female.dayMasterGan, female.dayMasterWuxing);
  details.push(`日干关系：${ganScore.desc} (+${ganScore.score}分)`);

  const zodiacScore = calcZodiacRelation(male.yearZhi, female.yearZhi);
  details.push(`生肖关系：${zodiacScore.desc} (+${zodiacScore.score}分)`);

  const balanceScore = calcDayMasterBalance(male, female);
  details.push(`日主平衡：${balanceScore.desc} (+${balanceScore.score}分)`);

  const shenshaScore = calcShenSha(male, female);
  details.push(`神煞参考：${shenshaScore.desc} (+${shenshaScore.score}分)`);

  let total = wuxingScore.score + ganScore.score + zodiacScore.score + balanceScore.score + shenshaScore.score;
  total = Math.max(10, Math.min(100, total));

  let hearts = '', level = '';
  if (total >= 90)      { hearts = '❤️❤️❤️❤️❤️'; level = '天作之合'; }
  else if (total >= 80) { hearts = '❤️❤️❤️❤️☆'; level = '良缘佳配'; }
  else if (total >= 70) { hearts = '❤️❤️❤️☆☆'; level = '相处融洽'; }
  else if (total >= 58) { hearts = '❤️❤️☆☆☆'; level = '需要磨合'; }
  else                  { hearts = '❤️☆☆☆☆'; level = '缘分较浅'; }

  return {
    score: total, hearts, level, details,
  };
}

function calcWuxingComplement(male: WuxingCount, female: WuxingCount): ScoreResult {
  const keys: (keyof WuxingCount)[] = ['metal','wood','water','fire','earth'];
  const kToCn: Record<keyof WuxingCount, string> = { metal:'金', wood:'木', water:'水', fire:'火', earth:'土' };

  let score = 10;
  const reasons: string[] = [];

  const combined = keys.map(k => male[k] + female[k]);
  const avg = combined.reduce((a,b)=>a+b,0) / 5;
  const variance = combined.reduce((s,v)=>s+(v-avg)**2,0)/5;

  for (const k of keys) {
    const cn = kToCn[k];
    const mCnt = male[k], fCnt = female[k];
    const targetCn = WX_SHENG[cn];
    const targetK = CN_TO_WX[targetCn];

    if (mCnt >= 3 && fCnt <= 1 && targetK && female[targetK] <= 1) {
      score += 3; reasons.push(`${cn}多可生`);
    }
    if (fCnt >= 3 && mCnt <= 1 && targetK && male[targetK] <= 1) {
      score += 3; reasons.push(`${cn}互补`);
    }
  }

  for (const k of keys) {
    const cn = kToCn[k];
    const enemyCn = WX_KE[cn];
    if (!enemyCn) continue;
    const eK = CN_TO_WX[enemyCn];
    if (male[k] >= 3 && female[eK] >= 3) {
      score -= 3; reasons.push(`${cn}${enemyCn}相克`);
    }
  }

  if (variance <= 2)      { score += 5; reasons.push('调和'); }
  else if (variance <= 4) { score += 2; reasons.push('尚均'); }

  const mAll = keys.every(k => male[k] > 0);
  const fAll = keys.every(k => female[k] > 0);
  if (mAll && fAll) { score += 4; reasons.push('皆全'); }
  else if (mAll || fAll) { score += 2; reasons.push('一方全'); }

  return { score: Math.max(1, Math.min(25, score)), desc: reasons.length ? reasons.join('，') : '五行常态' };
}

function calcDayMasterRelation(mGan: string, mWx: string, fGan: string, fWx: string): ScoreResult {
  if (WUHE[mGan] === fGan) {
    return { score: 25, desc: `「${mGan}${fGan}」天干五合` };
  }

  const mEl = GAN_TO_WX[mGan] || mWx;
  const fEl = GAN_TO_WX[fGan] || fWx;

  const mGenF = (WX_SHENG[mEl] === fEl);
  const fGenM = (WX_SHENG[fEl] === mEl);
  const mClashF = (WX_KE[mEl] === fEl);
  const fClashM = (WX_KE[fEl] === mEl);

  const isYinM = YIN_GAN.has(mGan);
  const isYinF = YIN_GAN.has(fGan);
  const diffYY = (isYinM !== isYinF);

  if (mClashF || fClashM) {
    if (diffYY) return { score: 10, desc: `「${mGan}${fGan}」稍克，阴阳可调` };
    if (mGenF || fGenM) return { score: 12, desc: `「${mGan}${fGan}」克中有生` };
    return { score: 7, desc: `「${mGan}${fGan}」同性相克` };
  }

  if (mGenF || fGenM) {
    if (diffYY) return { score: 22, desc: `「${mGan}${fGan}」阴阳相生` };
    return { score: 17, desc: `「${mGan}${fGan}」相生相助` };
  }

  if (mEl === fEl) {
    if (diffYY) return { score: 16, desc: `「${mGan}${fGan}」同属${mEl},阴阳和合` };
    return { score: 13, desc: `「${mGan}${fGan}」同属${mEl}` };
  }

  if (diffYY) return { score: 14, desc: `「${mGan}${fGan}」阴阳异质` };
  return { score: 11, desc: `「${mGan}${fGan}」平常` };
}

function calcZodiacRelation(mZhi: string, fZhi: string): ScoreResult {
  if (LIUHE[mZhi] === fZhi)     return { score: 20, desc: `「${mZhi}${fZhi}」六合` };
  if (SANHE[mZhi]?.includes(fZhi)) return { score: 17, desc: `「${mZhi}${fZhi}」三合` };
  if (mZhi === fZhi)            return { score: 11, desc: `同生肖${mZhi}` };
  if (LIUHAI[mZhi] === fZhi)    return { score: 7,  desc: `「${mZhi}${fZhi}」六害` };
  if (LIUCHONG[mZhi] === fZhi)  return { score: 4,  desc: `「${mZhi}${fZhi}」六冲` };
  return { score: 11, desc: `「${mZhi}」「${fZhi}」平常` };
}

function calcDayMasterBalance(male: BaziInfo, female: BaziInfo): ScoreResult {
  function getStrength(info: BaziInfo): number {
    const dwx = info.dayMasterWuxing;
    const sheng: Record<string, string> = { '木':'火','火':'土','土':'金','金':'水','水':'木' };
    let s = 0;
    const pillars = [info.chart.year, info.chart.month, info.chart.day];
    if (info.chart.hour) pillars.push(info.chart.hour);
    for (const p of pillars) {
      if (p.ganWuxing === dwx || p.zhiWuxing === dwx) s += 2;
      if (p.ganWuxing === sheng[dwx] || p.zhiWuxing === sheng[dwx]) s += 1;
    }
    return s;
  }

  const diff = Math.abs(getStrength(male) - getStrength(female));
  if (diff >= 3 && diff <= 6) return { score: 15, desc: '一强一弱，刚柔并济' };
  if (diff <= 2)             return { score: 11, desc: '强度相近' };
  if (diff <= 9)             return { score: 7,  desc: '差异较大' };
  return { score: 4, desc: '强度悬殊' };
}

function calcShenSha(male: BaziInfo, female: BaziInfo): ScoreResult {
  let score = 6;
  const benefits: string[] = [];

  const fPillars = [female.chart.year.zhi, female.chart.month.zhi, female.chart.day.zhi];
  if (female.chart.hour) fPillars.push(female.chart.hour.zhi);
  for (const zhi of fPillars) {
    if ((GUIREN[male.dayMasterGan]||[]).includes(zhi)) { score += 5; benefits.push('女带男贵人'); break; }
  }

  const mPillars = [male.chart.year.zhi, male.chart.month.zhi, male.chart.day.zhi];
  if (male.chart.hour) mPillars.push(male.chart.hour.zhi);
  for (const zhi of mPillars) {
    if ((GUIREN[female.dayMasterGan]||[]).includes(zhi)) { score += 4; benefits.push('男带女贵人'); break; }
  }

  const mEl = GAN_TO_WX[male.dayMasterGan] || male.dayMasterWuxing;
  const fEl = GAN_TO_WX[female.dayMasterGan] || female.dayMasterWuxing;
  if (WX_SHENG[mEl] === fEl || WX_SHENG[fEl] === mEl) { score += 2; benefits.push('十神相生'); }

  return { score: Math.min(15, Math.max(2, score)), desc: benefits.length ? benefits.join('+') : '平平' };
}

// ═══════════════════════════════════════════════════
// AI Analysis (按需触发)
// ═══════════════════════════════════════════════════

type Dimension = { key: string; title: string; score: number; content: string };
type Structured = { dimensions: Dimension[]; advices: string[]; highlight: string };

function clampScore(n: any, fallback: number): number {
  const num = Number(n);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function buildFallbackFromText(text: string, baseScore: number): Structured {
  const titles: { key: string; title: string }[] = [
    { key: 'basic', title: '基础契合度' },
    { key: 'personality', title: '性格相容性' },
    { key: 'palace', title: '婚配宫位' },
    { key: 'family', title: '家庭和谐' },
  ];
  const dimensions: Dimension[] = titles.map(t => {
    const re = new RegExp(`【\\s*${t.title}\\s*】([\\s\\S]*?)(?=【|$)`);
    const m = text.match(re);
    const content = (m?.[1] || '').trim() || `${t.title}尚需更多信息以做精细判断，建议结合双方实际相处情况综合考量。`;
    return { key: t.key, title: t.title, score: Math.max(50, Math.min(95, baseScore)), content };
  });
  const highlightMatch = text.match(/【\s*亮点(?:总结)?\s*】([\s\S]+?)$/);
  const highlight = (highlightMatch?.[1] || '').trim() || '双方在命理结构上各有所长，用心经营定能携手前行。';

  const familyContent = dimensions.find(d => d.key === 'family')?.content || '';
  const adviceLines = familyContent
    .split(/[\n。；;]+/)
    .map(s => s.replace(/^[\d\.、\-\s]+/, '').trim())
    .filter(s => s.length > 8 && s.length < 80);
  const advices = adviceLines.slice(0, 5).length >= 3 ? adviceLines.slice(0, 5) : [
    '日常多关注对方的情绪变化，及时表达欣赏与肯定。',
    '在涉及双方家庭的重大决定上，留出足够沟通时间。',
    '把握节奏的差异，给彼此独处与放松的空间。',
    '共同建立小仪式（晚餐、周末散步）增强长期联结。',
  ];

  return { dimensions, advices, highlight };
}

function tryParseStructured(raw: string, baseScore: number): Structured | null {
  if (!raw) return null;
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  const jsonStr = s.slice(first, last + 1);
  try {
    const obj = JSON.parse(jsonStr);
    if (!obj || !Array.isArray(obj.dimensions) || obj.dimensions.length === 0) return null;
    const titles: Record<string, string> = {
      basic: '基础契合度', personality: '性格相容性', palace: '婚配宫位', family: '家庭和谐',
    };
    const dimensions: Dimension[] = obj.dimensions.map((d: any, idx: number) => {
      const key = String(d.key || ['basic', 'personality', 'palace', 'family'][idx] || `dim${idx}`);
      return {
        key,
        title: String(d.title || titles[key] || '维度').slice(0, 40),
        score: clampScore(d.score, baseScore),
        content: String(d.content || '').slice(0, 600),
      };
    }).filter((d: Dimension) => d.content.length > 0);
    if (dimensions.length === 0) return null;
    const advices = Array.isArray(obj.advices)
      ? obj.advices.map((a: any) => String(a || '').trim()).filter((a: string) => a.length > 0).slice(0, 6)
      : [];
    const highlight = String(obj.highlight || '').trim().slice(0, 200);
    return { dimensions, advices, highlight };
  } catch {
    return null;
  }
}

async function runAIAnalysis(params: {
  safeMaleName: string;
  safeFemaleName: string;
  effectiveMaleDate: string;
  effectiveFemaleDate: string;
  maleSide: SidePayload;
  femaleSide: SidePayload;
  maleBazi: string;
  femaleBazi: string;
  score: number;
  level: string;
  details: string[];
  provider: ResolvedProvider;
}): Promise<{ structured: Structured; rawText: string; aiSource: string }> {
  const {
    safeMaleName, safeFemaleName, effectiveMaleDate, effectiveFemaleDate,
    maleSide, femaleSide, maleBazi, femaleBazi, score, level, details, provider,
  } = params;

  // prompt 材料先备齐，键才能算：姓名/出生地/农历标记都会进 prompt 与缓存正文，必须一起进键
  const malePlaceLine = maleSide.birthPlace ? `\n- 出生地：${sanitizeUserInput(String(maleSide.birthPlace), 50)}` : '';
  const femalePlaceLine = femaleSide.birthPlace ? `\n- 出生地：${sanitizeUserInput(String(femaleSide.birthPlace), 50)}` : '';
  const maleDateLine = maleSide.isLunar ? `${effectiveMaleDate}（农历）` : effectiveMaleDate;
  const femaleDateLine = femaleSide.isLunar ? `${effectiveFemaleDate}（农历）` : effectiveFemaleDate;

  const cacheKey = structCacheKey({
    maleBazi, femaleBazi,
    maleName: safeMaleName, femaleName: safeFemaleName,
    maleDateLine, femaleDateLine,
    malePlaceLine, femalePlaceLine,
    score, level, details,
  });
  const cached = await getCache(cacheKey);
  if (cached && cached.dimensions && Array.isArray(cached.dimensions)) {
    return {
      structured: {
        dimensions: cached.dimensions,
        advices: cached.advices || [],
        highlight: cached.highlight || '',
      },
      rawText: cached.analysis || '',
      aiSource: 'cache',
    };
  }

  const prompt = `你是"赛博命理师"的八字合婚分析功能。下面给出双方八字信息，请输出**严格 JSON**（不要任何前后注释/Markdown 代码块/前言）。

男方信息：
- 姓名：${safeMaleName}
- 出生日期：${maleDateLine}
- 八字：${maleBazi}${malePlaceLine}

女方信息：
- 姓名：${safeFemaleName}
- 出生日期：${femaleDateLine}
- 八字：${femaleBazi}${femalePlaceLine}

综合匹配度：${score}分（${level}）
算法维度参考（仅作背景参考）：
${details.join('\n')}

请严格按以下 JSON 结构输出（key/顺序/字段名一字不差）：

{
  "dimensions": [
    { "key": "basic",       "title": "基础契合度", "score": <0-100整数>, "content": "<约100-150字，从五行强弱、日主关系整体判断双方契合基础>" },
    { "key": "personality", "title": "性格相容性", "score": <0-100整数>, "content": "<约100-150字，从日干十神角度分析性格、节奏、沟通模式>" },
    { "key": "palace",      "title": "婚配宫位",   "score": <0-100整数>, "content": "<约100-150字，通过日支夫妻宫与生肖关系评估婚配宫的合冲>" },
    { "key": "family",      "title": "家庭和谐",   "score": <0-100整数>, "content": "<约100-150字，观照原生家庭影响、子女缘分与长期生活节奏>" }
  ],
  "advices": [
    "<具体可操作的相处建议1，约30-50字>",
    "<建议2>",
    "<建议3>",
    "<建议4>",
    "<建议5>"
  ],
  "highlight": "<一句话概括这对组合最大的优势，约30-60字>"
}

要求：
- dimensions 各维度 score 取 0-100 整数，总体分布与综合分 ${score} 相关。
- 语气专业、温和、有画面感，像资深命理师当面解读。
- advices 给 3-5 条，每条独立成句，不带序号。
- 直接输出 JSON，不要 \`\`\`json 围栏，不要前言。`;

  let structured: Structured | null = null;
  let rawText = '';
  let aiSource = 'fallback';

  try {
    const structuredRes = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        max_tokens: 6000,
        temperature: 0.4,
        enable_thinking: false,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: '你是赛博命理师，输出严格 JSON，不带任何额外文字或代码围栏。' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (structuredRes.ok) {
      const aiData = await structuredRes.json();
      rawText = aiData.choices?.[0]?.message?.content || '';
      structured = tryParseStructured(rawText, score);
      if (structured) {
        aiSource = 'deepseek';
      } else {
        structured = buildFallbackFromText(rawText, score);
        aiSource = 'deepseek-fallback';
      }
    }
  } catch (err) {
    console.error('AI call failed:', err);
    rawText = String(err instanceof Error ? err.message : err);
  }

  if (!structured) {
    structured = {
      dimensions: [
        { key: 'basic',       title: '基础契合度', score: Math.max(60, Math.min(90, score)), content: '双方八字基础结构有一定互补空间，五行格局上各有所长。日常以理解和包容为主，长期相处会愈发顺畅。' },
        { key: 'personality', title: '性格相容性', score: Math.max(60, Math.min(90, score - 3)), content: '性格节奏存在差异，但差异本身可以成为关系中的张力与新鲜感。多倾听对方的真实需求，可减少误解。' },
        { key: 'palace',      title: '婚配宫位',   score: Math.max(60, Math.min(90, score - 5)), content: '婚配宫位整体可调，少数节点需要彼此体谅。在重要决定与生活节奏上多商量，宫位影响会被淡化。' },
        { key: 'family',      title: '家庭和谐',   score: Math.max(60, Math.min(90, score - 2)), content: '家庭节奏的协同需要时间培养。建立稳定的相处仪式与分担机制，长远家庭氛围会非常温暖。' },
      ],
      advices: [
        '每日抽出 15 分钟专心听对方分享当天的情绪与琐事。',
        '在涉及双方家庭的事情上，留出足够沟通时间再做决定。',
        '保持各自的兴趣与朋友圈，给关系留出呼吸空间。',
        '建立属于你们的小仪式，增强长期的情感联结。',
      ],
      highlight: '你们的差异并非阻碍，而是彼此成长的机会，用心经营会愈发稳固。',
    };
  }

  // 缓存分级：
  // - 'deepseek'：解析成功的真结果，按 90 天存（合婚结论按双方八字定型，不会变）。
  // - 'deepseek-fallback'：模型返回了内容但 JSON 解析失败，靠 buildFallbackFromText 从散文里抠段落，
  //   抠不到的维度会退化成写死的模板句。这种半降级结果绝不能占住 90 天缓存位——
  //   同一对八字之后每次来都拿到模板且刷新无效。只给 120s 防同一用户连点造成的并发重复调用（防雪崩），
  //   到期后下一次请求会重新走 AI 拿真结果。
  // - 'fallback'：AI 完全没调通，纯本地模板，零成本可随时重算，不写缓存。
  // 写入交给 after()：此刻刚等完 10~60s 的 AI，Redis 连接必已冷，同步写要多付一次 ~268ms 握手（见 writeCacheAfterResponse）
  if (aiSource === 'deepseek' || aiSource === 'deepseek-fallback') {
    await writeCacheAfterResponse(cacheKey, {
      dimensions: structured.dimensions,
      advices: structured.advices,
      highlight: structured.highlight,
      analysis: rawText,
    }, aiSource === 'deepseek' ? MARRIAGE_CACHE_TTL : MARRIAGE_DEGRADED_CACHE_TTL);
  }

  return { structured, rawText, aiSource };
}

async function runDeepReport(params: {
  safeMaleName: string;
  safeFemaleName: string;
  maleSide: SidePayload;
  femaleSide: SidePayload;
  effectiveMaleDate: string;
  effectiveFemaleDate: string;
  maleBazi: string;
  femaleBazi: string;
  score: number;
  level: string;
  provider: ResolvedProvider;
}): Promise<{ deepReport: string; aiSource: string }> {
  const {
    safeMaleName, safeFemaleName, maleSide, femaleSide,
    effectiveMaleDate, effectiveFemaleDate, maleBazi, femaleBazi, score, level, provider,
  } = params;

  const maleDateLine = maleSide.isLunar ? `${effectiveMaleDate}（农历）` : effectiveMaleDate;
  const femaleDateLine = femaleSide.isLunar ? `${effectiveFemaleDate}（农历）` : effectiveFemaleDate;

  // 与 SSE 分支共用 deepCacheKey：两条路径共享同一批缓存条目，键材料必须逐字一致
  const cacheKey = deepCacheKey({
    maleBazi, femaleBazi,
    maleName: safeMaleName, femaleName: safeFemaleName,
    maleDateLine, femaleDateLine,
    score, level,
  });
  const cached = await getCache(cacheKey);
  // 与 SSE 分支同源阈值：两条路径共用同一个 cacheKey，读取门槛不一致会互相看到对方存不进/读不出的条目
  if (cached && typeof cached.deepReport === 'string' && cached.deepReport.length > DEEP_REPORT_MIN_READ_LEN) {
    return { deepReport: cached.deepReport, aiSource: 'cache' };
  }

  const deepReportPrompt = `你是一位精通子平命理的专业命理师，请为以下这对男女出具一份专业、深度的八字合婚分析报告。

【双方信息】
男方：${safeMaleName}，生于${maleDateLine}，八字：${maleBazi}
女方：${safeFemaleName}，生于${femaleDateLine}，八字：${femaleBazi}
系统初步评分：${score}分（${level}）

【报告格式要求】
- 严格按照以下五个章节结构输出，纯文本，不使用Markdown符号（不要##、**、*）
- 章节标题用「一、二、三、四、五、」开头，子标题用「1.」「2.」「3.」开头，要点用「·」开头
- 总字数1200-1800字，内容专业、论据充分，不要笼统的套话
- 必须结合双方具体八字信息来分析，不得用模板化语言敷衍

【报告结构】

一、 双方命局基础分析
（在分析婚姻互动之前，先明确双方命局的强弱与喜忌，这是判断互补或冲突的根本。）

- 男方：${safeMaleName}（日主：八字中的日柱天干）
  · 日主强弱：结合月令、得地、得助三个维度判断，给出明确的强/偏强/中和/偏弱/弱结论
  · 论据：详细说明月令（是否得令）、地支根气、天干帮扶克泄的情况，以及综合判断依据
  · 喜忌神：明确列出喜用神和忌神
  · 妻星（财星）定位：指出正财偏财是哪个五行/天干，妻星在命局中的位置和状态

- 女方：${safeFemaleName}（日主：八字中的日柱天干）
  · 日主强弱：同上维度判断
  · 论据：详细说明
  · 喜忌神：明确列出
  · 夫星（官杀星）定位：指出正官七杀是哪个五行/天干，夫星在命局中的位置和状态

二、 婚姻关系核心互动分析

1. 日柱配合：天干相生相克关系？地支是否有合、冲、刑？对婚姻根基意味着什么？
（约200-250字，要有具体分析，不能只说「还可以」或「有问题」）

2. 十神与五行：深层互补还是相克？
· 五行互补分析：男方喜用神是否是女方命局所旺之气？女方喜用神是否能从男方命局中得到？
· 角色定位：基于十神关系，描述双方在关系中的自然角色和互动模式
（约200字）

3. 潜在问题：宫位刑冲与命理隐患
· 男方夫妻宫（日支）是否受到命局中其他地支的冲、刑、害？代表什么含义？
· 女方夫妻宫（日支）是否受到命局中其他地支的冲、刑、害？代表什么含义？
· 其他十神层面的潜在冲突信号（如多财、多杀等）
（约150字）

三、 大运流年同步性分析

- 男方当前大运：推算男方当前所走的大运（天干地支），分析对婚姻的影响
- 女方当前大运：推算女方当前所走的大运（天干地支），分析对婚姻的影响
- 大运配合：两人大运之间是否形成有利或不利的互动？

流年关键节点（${new Date().getFullYear()}年及未来2-3年）：
· ${new Date().getFullYear()}年（${new Date().getFullYear() - 2024 + 4}岁）：流年天干地支，对双方关系各自意味着什么？是否有重要合冲？
· ${new Date().getFullYear() + 1}年：流年天干地支，婚姻宫是否有动？
· ${new Date().getFullYear() + 2}年：流年天干地支，是否有需要特别注意的关键节点？
（约200字）

四、 总结与建议

- 关系评价：基于以上分析，给出综合评价（关系的优势和根基）
- 潜在风险：主要风险点（1-2个最核心的）
- 实用建议（4条，每条有具体可操作性）：
  a. 建议一：针对命局和大运特点的具体建议
  b. 建议二：化解夫妻宫冲刑的方法
  c. 建议三：针对流年关键节点的预警与应对
  d. 建议四：长期经营婚姻关系的核心心法（结合双方日主五行特性）

【重要提示】
- 所有分析必须基于双方实际八字，不能用套话
- 大运推算要符合男女顺逆（男阳女阴顺行，男阴女阳逆行）规则
- 如某项信息无法从八字中确定，请如实说明，不要杜撰`;

  try {
    const deepReportRes = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        max_tokens: 6000,
        temperature: 0.5,
        enable_thinking: false,
        messages: [
          { role: 'system', content: '你是一位精通子平命理、擅长婚姻关系分析的专业命理师。请按照用户要求的报告格式，输出专业、有深度、有论据的八字合婚分析报告。纯文本输出，不使用任何Markdown符号（不要##、**、*、-等），章节标题用「一、二、三」开头，子标题用「1.2.3.」开头，要点用「·」开头。字数要充实，分析要有具体论据。' },
          { role: 'user', content: deepReportPrompt },
        ],
      }),
    });

    if (deepReportRes.ok) {
      const drData = await deepReportRes.json();
      const raw = drData.choices?.[0]?.message?.content || '';
      const deepReport = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      // 与下方 SSE 版同一套阈值：完整报告进 90 天长缓存，被 max_tokens 截断的中等长度报告
      // 只进 120s 短缓存（防雪崩又不会霸占 90 天），过短的不缓存。
      // 短报告仍照常返回给本次请求的用户，这里只决定「要不要留给下一个人」。
      // 注：本函数当前无调用方（深度报告走下方 SSE 分支），保留同样的守卫是为了日后接回时不再引入同一个坑。
      const deepTtl = deepReportCacheTtl(deepReport);
      if (deepTtl > 0) {
        // 同 struct 分支：AI 等完之后连接已冷，这次写挪到响应之后再做
        await writeCacheAfterResponse(cacheKey, { deepReport }, deepTtl);
      }
      return { deepReport, aiSource: 'deepseek' };
    } else {
      const errBody = await deepReportRes.text().catch(() => '');
      console.error('deepReport AI call failed:', deepReportRes.status, errBody.slice(0, 200));
      return { deepReport: '', aiSource: 'error' };
    }
  } catch (err) {
    console.error('deepReport AI call exception:', err);
    return { deepReport: '', aiSource: 'error' };
  }
}

// ═══════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const url = new URL(req.url);
  const aiParam = url.searchParams.get('ai');
  const aiOnly = aiParam === '1';
  const aiDeep = aiParam === 'deep';
  const isAiRequest = aiOnly || aiDeep;

  // 先解析 + 校验请求体，再扣配额（下面 isValidBirthDate 之后）：
  // 原顺序在日期非法/body 不是合法 JSON 时已经扣掉了当天唯一一次免费合婚且不退。
  // `?? {}` 兜住 body 是字面 null 的情况（JSON.parse('null') 不进 catch，直接解构会抛 → 500）
  const body = (await req.json().catch(() => ({}))) ?? {};
  const {
    maleName,
    maleBirthDate,
    maleBirthHour,
    femaleName,
    femaleBirthDate,
    femaleBirthHour,
    male: malePayload,
    female: femalePayload,
  } = body as {
    maleName?: string;
    maleBirthDate?: string;
    maleBirthHour?: string;
    femaleName?: string;
    femaleBirthDate?: string;
    femaleBirthHour?: string;
    male?: SidePayload;
    female?: SidePayload;
  };

  const maleSide: SidePayload = malePayload || {};
  const femaleSide: SidePayload = femalePayload || {};

  const effectiveMaleDate = maleSide.birthDate || maleBirthDate;
  const effectiveFemaleDate = femaleSide.birthDate || femaleBirthDate;

  function isValidBirthDate(dateStr: unknown): boolean {
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const ts = Date.parse(dateStr);
    if (isNaN(ts)) return false;
    const year = new Date(ts).getUTCFullYear();
    return year >= 1900 && year <= 2030;
  }

  if (!isValidBirthDate(effectiveMaleDate)) {
    return NextResponse.json({ error: '男方出生日期无效，请使用 YYYY-MM-DD 格式，年份范围 1900-2030' }, { status: 400 });
  }
  if (!isValidBirthDate(effectiveFemaleDate)) {
    return NextResponse.json({ error: '女方出生日期无效，请使用 YYYY-MM-DD 格式，年份范围 1900-2030' }, { status: 400 });
  }

  // 仅在硬数据请求时消耗配额，AI 请求复用同一配额（视作同一次合婚的子操作）
  if (!isAiRequest) {
    // 统一配额策略 v1：合婚使用独立额度（免费 1 次/天），不再共享八字解读名额。
    // 会员态取自 JWT（isSubscribed），省一次跨区 DB 往返；「刚付费未刷新」由 quota 内部兜底复核
    const { checkMarriageQuota } = await import('@/lib/quota');
    const marriageQuota = await checkMarriageQuota(session.user.id, session.user.isSubscribed);
    if (!marriageQuota.hasQuota) {
      return NextResponse.json(
        { error: 'QUOTA_EXCEEDED', message: '今日免费合婚次数已用完，请升级 VIP' },
        { status: 403 }
      );
    }
  }

  const safeMaleName = sanitizeUserInput(String(maleSide.name || maleName || ''), 50) || '男方';
  const safeFemaleName = sanitizeUserInput(String(femaleSide.name || femaleName || ''), 50) || '女方';

  const maleInfo = calculateFullBazi(effectiveMaleDate as string, maleBirthHour || '-1', {
    ...maleSide,
    name: safeMaleName,
    gender: maleSide.gender || 'male',
  });
  const femaleInfo = calculateFullBazi(effectiveFemaleDate as string, femaleBirthHour || '-1', {
    ...femaleSide,
    name: safeFemaleName,
    gender: femaleSide.gender || 'female',
  });

  const maleBazi = formatBazi(maleInfo);
  const femaleBazi = formatBazi(femaleInfo);

  const { score, hearts, level, details } = calculateScore(maleInfo, femaleInfo);

  // ── ?ai=1：仅返回 AI 结构化分析（约 10s） ────────────────────
  if (aiOnly) {
    const provider = await getPrimaryProvider();
    if (!provider) {
      return NextResponse.json({ error: 'AI 服务未配置' }, { status: 503 });
    }
    const { structured, rawText, aiSource } = await runAIAnalysis({
      safeMaleName, safeFemaleName,
      effectiveMaleDate: effectiveMaleDate as string,
      effectiveFemaleDate: effectiveFemaleDate as string,
      maleSide, femaleSide, maleBazi, femaleBazi, score, level, details,
      provider,
    });

    return NextResponse.json({
      score,
      dimensions: structured.dimensions,
      advices: structured.advices,
      highlight: structured.highlight,
      analysis: rawText,
      _source: aiSource,
    });
  }

  // ── ?ai=deep：SSE streaming 深度命理报告 ────────────────────
  if (aiDeep) {
    try {
    const provider = await getPrimaryProvider();
    if (!provider) {
      return NextResponse.json({ error: 'AI 服务未配置', deepReport: '' }, { status: 503 });
    }
    const maleDateLine = maleSide.isLunar ? `${effectiveMaleDate}（农历）` : effectiveMaleDate;
    const femaleDateLine = femaleSide.isLunar ? `${effectiveFemaleDate}（农历）` : effectiveFemaleDate;

    // 与 runDeepReport 共用 deepCacheKey：姓名/出生日期都进 prompt 与正文，必须进键（见 deepCacheKey 注释）
    const cacheKey = deepCacheKey({
      maleBazi, femaleBazi,
      maleName: safeMaleName, femaleName: safeFemaleName,
      maleDateLine: maleDateLine as string, femaleDateLine: femaleDateLine as string,
      score, level,
    });
    const encoder = new TextEncoder();

    // 缓存命中：以 SSE 格式一次性推送，前端逻辑统一
    const cached = await getCache(cacheKey);
    // 与写入侧同源阈值（DEEP_REPORT_MIN_READ_LEN），避免再次出现「读得进、写不出」的长度死区
    if (cached && typeof cached.deepReport === 'string' && cached.deepReport.length > DEEP_REPORT_MIN_READ_LEN) {
      const cachedText = cached.deepReport;
      const cacheStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: cachedText })}\n\n`));
          controller.close();
        },
      });
      return new Response(cacheStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const deepReportPrompt = `你是一位精通子平命理的专业命理师，请为以下这对男女出具一份专业、深度的八字合婚分析报告。

【双方信息】
男方：${safeMaleName}，生于${maleDateLine}，八字：${maleBazi}
女方：${safeFemaleName}，生于${femaleDateLine}，八字：${femaleBazi}
系统初步评分：${score}分（${level}）

【报告格式要求】
- 严格按照以下五个章节结构输出，纯文本，不使用Markdown符号（不要##、**、*）
- 章节标题用「一、二、三、四、五、」开头，子标题用「1.」「2.」「3.」开头，要点用「·」开头
- 总字数1200-1800字，内容专业、论据充分，不要笼统的套话
- 必须结合双方具体八字信息来分析，不得用模板化语言敷衍

【报告结构】

一、 双方命局基础分析
（在分析婚姻互动之前，先明确双方命局的强弱与喜忌，这是判断互补或冲突的根本。）

- 男方：${safeMaleName}（日主：八字中的日柱天干）
  · 日主强弱：结合月令、得地、得助三个维度判断，给出明确的强/偏强/中和/偏弱/弱结论
  · 论据：详细说明月令（是否得令）、地支根气、天干帮扶克泄的情况，以及综合判断依据
  · 喜忌神：明确列出喜用神和忌神
  · 妻星（财星）定位：指出正财偏财是哪个五行/天干，妻星在命局中的位置和状态

- 女方：${safeFemaleName}（日主：八字中的日柱天干）
  · 日主强弱：同上维度判断
  · 论据：详细说明
  · 喜忌神：明确列出
  · 夫星（官杀星）定位：指出正官七杀是哪个五行/天干，夫星在命局中的位置和状态

二、 婚姻关系核心互动分析

1. 日柱配合：天干相生相克关系？地支是否有合、冲、刑？对婚姻根基意味着什么？
（约200-250字，要有具体分析，不能只说「还可以」或「有问题」）

2. 十神与五行：深层互补还是相克？
· 五行互补分析：男方喜用神是否是女方命局所旺之气？女方喜用神是否能从男方命局中得到？
· 角色定位：基于十神关系，描述双方在关系中的自然角色和互动模式
（约200字）

3. 潜在问题：宫位刑冲与命理隐患
· 男方夫妻宫（日支）是否受到命局中其他地支的冲、刑、害？代表什么含义？
· 女方夫妻宫（日支）是否受到命局中其他地支的冲、刑、害？代表什么含义？
· 其他十神层面的潜在冲突信号（如多财、多杀等）
（约150字）

三、 大运流年同步性分析

- 男方当前大运：推算男方当前所走的大运（天干地支），分析对婚姻的影响
- 女方当前大运：推算女方当前所走的大运（天干地支），分析对婚姻的影响
- 大运配合：两人大运之间是否形成有利或不利的互动？

流年关键节点（${new Date().getFullYear()}年及未来2-3年）：
· ${new Date().getFullYear()}年（${new Date().getFullYear() - 2024 + 4}岁）：流年天干地支，对双方关系各自意味着什么？是否有重要合冲？
· ${new Date().getFullYear() + 1}年：流年天干地支，婚姻宫是否有动？
· ${new Date().getFullYear() + 2}年：流年天干地支，是否有需要特别注意的关键节点？
（约200字）

四、 总结与建议

- 关系评价：基于以上分析，给出综合评价（关系的优势和根基）
- 潜在风险：主要风险点（1-2个最核心的）
- 实用建议（4条，每条有具体可操作性）：
  a. 建议一：针对命局和大运特点的具体建议
  b. 建议二：化解夫妻宫冲刑的方法
  c. 建议三：针对流年关键节点的预警与应对
  d. 建议四：长期经营婚姻关系的核心心法（结合双方日主五行特性）

【重要提示】
- 所有分析必须基于双方实际八字，不能用套话
- 大运推算要符合男女顺逆（男阳女阴顺行，男阴女阳逆行）规则
- 如某项信息无法从八字中确定，请如实说明，不要杜撰`;

    const aiRes = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      // 跟随客户端断连掐掉上游：否则用户关页面后，上游流仍会读到底，
      // start() 迟迟不 unwind → markStreamDone 不触发 → flushCacheWrite 在 waitUntil 里
      // 空等到 15s 兜底才退出，白占函数活跃时长（Fluid Compute 按活跃时间计费）。
      signal: req.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        max_tokens: 6000,
        temperature: 0.5,
        enable_thinking: false,
        stream: true,
        messages: [
          { role: 'system', content: '你是一位精通子平命理、擅长婚姻关系分析的专业命理师。请按照用户要求的报告格式，输出专业、有深度、有论据的八字合婚分析报告。纯文本输出，不使用任何Markdown符号（不要##、**、*、-等），章节标题用「一、二、三」开头，子标题用「1.2.3.」开头，要点用「·」开头。字数要充实，分析要有具体论据。' },
          { role: 'user', content: deepReportPrompt },
        ],
      }),
    });

    if (!aiRes.ok || !aiRes.body) {
      return NextResponse.json({ deepReport: '', _source: 'error' });
    }

    let fullText = '';

    // —— 收尾（写缓存）挪到关流之后 ——
    // 深度报告要流 20~60s，等模型吐完时 undici 的 keep-alive（默认 4s）早已过期，
    // 这一次 Redis 写必然要重新 TCP+TLS 握手（生产实测 ~268ms）。原来它阻在 controller.close() 之前，
    // 用户正文早已看全，却还要多等一次握手才收到流结束、loading 才消失。
    // after() 在 Vercel 上映射到 waitUntil，响应关闭后仍保证执行（游离 Promise 会被冻结的实例丢掉）。
    let pendingCacheWrite: { text: string; ttl: number } | null = null;
    let markStreamDone: () => void = () => {};
    const streamDone = new Promise<void>((resolve) => { markStreamDone = resolve; });
    const flushCacheWrite = async () => {
      // 客户端断连时响应会先于 start() 结束而关闭，after() 回调可能被提前唤醒——
      // 那一刻还不知道该不该写，必须等 start() 收完尾（再兜一层超时，绝不把 waitUntil 挂死）
      await new Promise<void>((resolve) => {
        const t = setTimeout(resolve, 15_000);
        void streamDone.then(() => { clearTimeout(t); resolve(); });
      });
      if (!pendingCacheWrite) return;
      await setCache(cacheKey, { deepReport: pendingCacheWrite.text }, pendingCacheWrite.ttl).catch(() => {});
    };
    // 拿不到 waitUntil 的运行时里 after() 会同步抛错：退回「关流后内联执行」，至少不比改造前差
    let flushInline = false;
    try {
      after(flushCacheWrite);
    } catch (e) {
      flushInline = true;
      console.warn('[marriage deep] after() unavailable, flush cache inline:', e instanceof Error ? e.message : e);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta?.content || '';
                if (delta) {
                  fullText += delta;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
                }
              } catch { /* ignore parse errors */ }
            }
          }
          // 按长度分级落缓存，中途断流的残报告不该和完整报告享受同样的 90 天：
          // 1) 阈值改判 cleanText —— 原来判 fullText，模型先吐一大段 <think> 再被截断时
          //    fullText 轻松过百、cleanText 却可能只剩几十字，照样被存 90 天。
          // 2) 长度分级见 deepReportCacheTtl：>600 存 90 天，200~600 存 120s（与读缓存阈值对齐，
          //    不留「读得进、写不出」的死区），≤200 读缓存那侧本就不认，不存。
          // 用户已经通过 SSE 收到全部内容，这里只决定「要不要留给下一个人」，不影响本次返回。
          // 只在读完整条流的正常路径上登记：中途抛错（多为客户端断连）保持 pendingCacheWrite = null，
          // 残报告不该被当成完整报告缓存起来。真正的写入由 after() 在关流之后执行。
          const cleanText = fullText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
          const cleanTtl = deepReportCacheTtl(cleanText);
          if (cleanTtl > 0) {
            pendingCacheWrite = { text: cleanText, ttl: cleanTtl };
          }
        } finally {
          // 先放行 after() 回调：写什么、写不写此刻已经定了（正常收尾在 try 里赋过值，异常路径就是不写）
          markStreamDone();
          try {
            controller.close();
            reader.releaseLock();
          } finally {
            // 仅 after() 不可用的运行时会走到：关流后内联补写，保证不比改造前差
            if (flushInline) await flushCacheWrite();
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    } catch (deepErr) {
      console.error('[aiDeep] error:', deepErr);
      return NextResponse.json({ error: String(deepErr instanceof Error ? deepErr.message : deepErr), deepReport: '' }, { status: 500 });
    }
  }

  // ── 默认：仅返回硬数据（命盘+五行+十神+总分），不调 AI ──
  return NextResponse.json({
    score, hearts, level,
    maleBazi, femaleBazi,
    male: buildSideExport(safeMaleName, 'male', maleInfo),
    female: buildSideExport(safeFemaleName, 'female', femaleInfo),
    details,
    disclaimer: '⚠️ 仅供参考，匹配度评分基于五行互补、日干关系、生肖相合等传统命理算法，不代表真实命运。人生幸福取决于彼此的理解与经营。',
  });
}
