import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';
import { sanitizeUserInput } from '@/lib/utils/sanitize';

import { authOptions } from '@/lib/auth';
import { calculateBazi as realCalculateBazi } from '@/lib/bazi';
import { AI_BASE_URL, PRIMARY_MODEL, FALLBACK_MODEL } from '@/lib/ai/models';
import {
  calcSideShishen,
  buildShishenSummary,
  type SideShishen,
  type ShishenSummary,
} from '@/lib/marriage/shishen';

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
}): Promise<{ structured: Structured; rawText: string; aiSource: string }> {
  const {
    safeMaleName, safeFemaleName, effectiveMaleDate, effectiveFemaleDate,
    maleSide, femaleSide, maleBazi, femaleBazi, score, level, details,
  } = params;

  const cacheKey = generateCacheKey('marriage:ai:struct:v1', { male: maleBazi, female: femaleBazi });
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

  const malePlaceLine = maleSide.birthPlace ? `\n- 出生地：${sanitizeUserInput(String(maleSide.birthPlace), 50)}` : '';
  const femalePlaceLine = femaleSide.birthPlace ? `\n- 出生地：${sanitizeUserInput(String(femaleSide.birthPlace), 50)}` : '';
  const maleDateLine = maleSide.isLunar ? `${effectiveMaleDate}（农历）` : effectiveMaleDate;
  const femaleDateLine = femaleSide.isLunar ? `${effectiveFemaleDate}（农历）` : effectiveFemaleDate;

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
    const structuredRes = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        max_tokens: 3000,
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

  if (aiSource !== 'fallback') {
    await setCache(cacheKey, {
      dimensions: structured.dimensions,
      advices: structured.advices,
      highlight: structured.highlight,
      analysis: rawText,
    });
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
}): Promise<{ deepReport: string; aiSource: string }> {
  const {
    safeMaleName, safeFemaleName, maleSide, femaleSide,
    effectiveMaleDate, effectiveFemaleDate, maleBazi, femaleBazi, score, level,
  } = params;

  const cacheKey = generateCacheKey('marriage:ai:deep:v3', { male: maleBazi, female: femaleBazi });
  const cached = await getCache(cacheKey);
  if (cached && typeof cached.deepReport === 'string' && cached.deepReport.length > 0) {
    return { deepReport: cached.deepReport, aiSource: 'cache' };
  }

  const maleDateLine = maleSide.isLunar ? `${effectiveMaleDate}（农历）` : effectiveMaleDate;
  const femaleDateLine = femaleSide.isLunar ? `${effectiveFemaleDate}（农历）` : effectiveFemaleDate;

  const deepReportPrompt = `请为以下这对男女出具深度八字合婚命理报告，总字数600-800字：

男方：${safeMaleName}，生于${maleDateLine}，八字：${maleBazi}
女方：${safeFemaleName}，生于${femaleDateLine}，八字：${femaleBazi}
综合匹配度：${score}分（${level}）

报告结构：
一、双方命局独立分析
1. ${safeMaleName}（乾造）
· 日主强弱：分析日主五行强弱，喜忌神
· 婚姻宫与配偶星：分析日支、财星或官星
· 刑冲关系：地支刑冲对婚姻的影响

2. ${safeFemaleName}（坤造）
· 日主强弱：分析日主五行强弱，喜忌神
· 婚姻宫与配偶星：分析日支、官星或财星
· 刑冲关系：地支刑冲对婚姻的影响

二、双方合盘互动解析
1. 日柱配合分析（婚姻核心，约80字）
2. 十神互补分析（约60字）
3. 潜在矛盾点（1-2个命理隐患，约60字）

三、大运流年对婚姻的影响
当前大运互动（${new Date().getFullYear()}年，约80字）
流年契机（${new Date().getFullYear()}年，约60字）
未来关键节点（未来2-3年，约60字）

四、结论与建议
总结（约60字）
具体建议：
1. 建议一（约30字）
2. 建议二（约30字）
3. 建议三（约30字）
4. 建议四（约30字）`;

  try {
    const deepReportRes = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        max_tokens: 2000,
        temperature: 0.5,
        enable_thinking: false,
        messages: [
          { role: 'system', content: '你是赛博命理师，请输出深度八字合婚命理报告，纯文本格式，不要任何Markdown符号（不要##、**、*、-）。章节标题用中文数字如「一、」开头，子标题用「1.」「2.」开头，要点用「·」开头。' },
          { role: 'user', content: deepReportPrompt },
        ],
      }),
    });

    if (deepReportRes.ok) {
      const drData = await deepReportRes.json();
      const raw = drData.choices?.[0]?.message?.content || '';
      const deepReport = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      if (deepReport) {
        await setCache(cacheKey, { deepReport });
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const url = new URL(req.url);
  const aiParam = url.searchParams.get('ai');
  const aiOnly = aiParam === '1';
  const aiDeep = aiParam === 'deep';
  const isAiRequest = aiOnly || aiDeep;

  // 仅在硬数据请求时消耗配额，AI 请求复用同一配额（视作同一次合婚的子操作）
  if (!isAiRequest) {
    const { useBaziQuota } = await import('@/lib/quota');
    const hasQuota = await useBaziQuota(session.user.id);
    if (!hasQuota) {
      return NextResponse.json(
        { error: 'QUOTA_EXCEEDED', message: '今日免费合婚次数已用完，请升级 VIP' },
        { status: 403 }
      );
    }
  }

  const body = await req.json();
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
    const { structured, rawText, aiSource } = await runAIAnalysis({
      safeMaleName, safeFemaleName,
      effectiveMaleDate: effectiveMaleDate as string,
      effectiveFemaleDate: effectiveFemaleDate as string,
      maleSide, femaleSide, maleBazi, femaleBazi, score, level, details,
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
    const maleDateLine = maleSide.isLunar ? `${effectiveMaleDate}（农历）` : effectiveMaleDate;
    const femaleDateLine = femaleSide.isLunar ? `${effectiveFemaleDate}（农历）` : effectiveFemaleDate;

    const cacheKey = generateCacheKey('marriage:ai:deep:v3', { male: maleBazi, female: femaleBazi });
    const encoder = new TextEncoder();

    // 缓存命中：以 SSE 格式一次性推送，前端逻辑统一
    const cached = await getCache(cacheKey);
    if (cached && typeof cached.deepReport === 'string' && cached.deepReport.length > 200) {
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

    const deepReportPrompt = `请为以下这对男女出具深度八字合婚命理报告，总字数600-800字：

男方：${safeMaleName}，生于${maleDateLine}，八字：${maleBazi}
女方：${safeFemaleName}，生于${femaleDateLine}，八字：${femaleBazi}
综合匹配度：${score}分（${level}）

报告结构：
一、双方命局独立分析
1. ${safeMaleName}（乾造）
· 日主强弱：分析日主五行强弱，喜忌神
· 婚姻宫与配偶星：分析日支、财星或官星
· 刑冲关系：地支刑冲对婚姻的影响

2. ${safeFemaleName}（坤造）
· 日主强弱：分析日主五行强弱，喜忌神
· 婚姻宫与配偶星：分析日支、官星或财星
· 刑冲关系：地支刑冲对婚姻的影响

二、双方合盘互动解析
1. 日柱配合分析（婚姻核心，约80字）
2. 十神互补分析（约60字）
3. 潜在矛盾点（1-2个命理隐患，约60字）

三、大运流年对婚姻的影响
当前大运互动（${new Date().getFullYear()}年，约80字）
流年契机（${new Date().getFullYear()}年，约60字）
未来关键节点（未来2-3年，约60字）

四、结论与建议
总结（约60字）
具体建议：
1. 建议一（约30字）
2. 建议二（约30字）
3. 建议三（约30字）
4. 建议四（约30字）`;

    const aiRes = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        max_tokens: 2000,
        temperature: 0.5,
        enable_thinking: false,
        stream: true,
        messages: [
          { role: 'system', content: '你是赛博命理师，请输出深度八字合婚命理报告，纯文本格式，不要任何Markdown符号（不要##、**、*、-）。章节标题用中文数字如「一、」开头，子标题用「1.」「2.」开头，要点用「·」开头。' },
          { role: 'user', content: deepReportPrompt },
        ],
      }),
    });

    if (!aiRes.ok || !aiRes.body) {
      return NextResponse.json({ deepReport: '', _source: 'error' });
    }

    let fullText = '';
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
          if (fullText.length > 100) {
            const cleanText = fullText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            await setCache(cacheKey, { deepReport: cleanText }).catch(() => {});
          }
        } finally {
          controller.close();
          reader.releaseLock();
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
