import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateCacheKey, getCache, setCache } from '@/lib/ai/cache';

import { authOptions } from '@/lib/auth';
import { calculateBazi as realCalculateBazi } from '@/lib/bazi';
import { TIANGAN_WUXING, DIZHI_WUXING, TIANGAN_LIST, DIZHI_LIST } from '@/lib/bazi/constants';

// ── 八字计算 ───────────────────────────────────────

interface WuxingCount { metal: number; wood: number; water: number; fire: number; earth: number; }
interface Pillar { gan: string; zhi: string; ganWuxing: string; zhiWuxing: string; }
interface BaziChart { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null; }

interface BaziInfo {
  birthDate: string;
  birthHour: string;
  chart: BaziChart;
  wuxing: WuxingCount;
  dayMasterGan: string; // 日干
  dayMasterWuxing: string; // 日干五行
  yearZhi: string; // 年支（生肖）
}

function calculateFullBazi(birthDate: string, birthHour: string): BaziInfo {
  const hourMap: Record<string, string> = {
    '子时': '子时', '丑时': '丑时', '寅时': '寅时', '卯时': '卯时',
    '辰时': '辰时', '巳时': '巳时', '午时': '午时', '未时': '未时',
    '申时': '申时', '酉时': '酉时', '戌时': '戌时', '亥时': '亥时',
    '不知道': '午时',
  };

  const result = realCalculateBazi({
    name: '',
    gender: 'male',
    birthDate,
    birthHour: (hourMap[birthHour] || '午时') as any,
  });

  return {
    birthDate,
    birthHour,
    chart: result.chart,
    wuxing: result.wuxing,
    dayMasterGan: result.chart.day.gan,
    dayMasterWuxing: result.chart.day.ganWuxing,
    yearZhi: result.chart.year.zhi,
  };
}

function formatBazi(info: BaziInfo): string {
  const { chart } = info;
  const h = chart.hour ? `${chart.hour.gan}${chart.hour.zhi}` : '?';
  return `${chart.year.gan}${chart.year.zhi}年 ${chart.month.gan}${chart.month.zhi}月 ${chart.day.gan}${chart.day.zhi}日 ${h}时`;
}

// ── 合婚算法 ───────────────────────────────────────

/**
 * 基于传统命理学的合婚匹配度算法（纯维度加分制）
 * 五大维度：五行互补(30) + 日干关系(25) + 生肖相合(20) + 日主平衡(15) + 神煞(10) = 满分100
 * 无基准分，各维度从 0 开始计分，实际分布区间约 50-95
 */
function calculateScore(male: BaziInfo, female: BaziInfo) {
  const details: string[] = [];

  // ── 1. 五行互补 (30分) ──
  const wuxingScore = calcWuxingComplement(male.wuxing, female.wuxing);
  details.push(`五行互补：${wuxingScore.desc} (+${wuxingScore.score}分)`);

  // ── 2. 日干关系 (25分) ──
  const ganScore = calcDayMasterRelation(male.dayMasterGan, male.dayMasterWuxing, female.dayMasterGan, female.dayMasterWuxing);
  details.push(`日干关系：${ganScore.desc} (+${ganScore.score}分)`);

  // ── 3. 生肖相合 (20分) ──
  const zodiacScore = calcZodiacRelation(male.yearZhi, female.yearZhi);
  details.push(`生肖关系：${zodiacScore.desc} (+${zodiacScore.score}分)`);

  // ── 4. 日主强弱平衡 (15分) ──
  const balanceScore = calcDayMasterBalance(male, female);
  details.push(`日主平衡：${balanceScore.desc} (+${balanceScore.score}分)`);

  // ── 5. 神煞参考 (10分) ──
  const shenshaScore = calcShenSha(male, female);
  details.push(`神煞参考：${shenshaScore.desc} (+${shenshaScore.score}分)`);

  let total = wuxingScore.score
    + ganScore.score
    + zodiacScore.score
    + balanceScore.score
    + shenshaScore.score;

  total = Math.max(40, Math.min(100, total));

  let hearts = '';
  let level = '';
  if (total >= 90) { hearts = '❤️❤️❤️❤️❤️'; level = '天作之合'; }
  else if (total >= 80) { hearts = '❤️❤️❤️❤️☆'; level = '良缘佳配'; }
  else if (total >= 70) { hearts = '❤️❤️❤️☆☆'; level = '相处融洽'; }
  else if (total >= 60) { hearts = '❤️❤️☆☆☆'; level = '需要磨合'; }
  else { hearts = '❤️☆☆☆☆'; level = '缘分较浅'; }

  return { score: total, hearts, level, details, _debug: { wuxing: wuxingScore.score, gan: ganScore.score, zodiac: zodiacScore.score, balance: balanceScore.score, shensha: shenshaScore.score, rawTotal: total } };
}

// ── 维度1：五行互补 (满分30) ────────────────────────
function calcWuxingComplement(male: WuxingCount, female: WuxingCount): { score: number; desc: string } {
  const SHENG: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const KE: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  const WX_KEYS: (keyof WuxingCount)[] = ['metal', 'wood', 'water', 'fire', 'earth'];
  const WX_CN: Record<string, keyof WuxingCount> = { '金': 'metal', '木': 'wood', '水': 'water', '火': 'fire', '土': 'earth' };

  let score = 8;
  const reasons: string[] = [];

  // 互补加分：一方旺的五行恰好能生助另一方所需
  for (const [element, count] of Object.entries(male)) {
    const key = element as keyof WuxingCount;
    if (!WX_KEYS.includes(key)) continue;
    if (count >= 3 && female[key] <= 1) {
      const target = SHENG[element];
      if (target && female[WX_CN[target] || target as keyof WuxingCount] >= 2) {
        score += 3;
        reasons.push(`${element}多→生${target}(女有)`);
      }
    }
    if (count <= 1 && female[key] >= 3) {
      const target = SHENG[element];
      if (target && male[WX_CN[target] || target as keyof WuxingCount] >= 2) {
        score += 3;
        reasons.push(`${element}少←被${target}(男有)生`);
      }
    }
  }

  // 相克扣分
  for (const [element, count] of Object.entries(male)) {
    if (!WX_KEYS.includes(element as keyof WuxingCount)) continue;
    const keTarget = KE[element];
    if (keTarget && count >= 3 && female[WX_CN[keTarget] || keTarget as keyof WuxingCount] >= 3) {
      score -= 4;
      reasons.push(`${element}克${keTarget}(冲突)`);
    }
  }

  // 五行分布均衡度：合并后五行越均匀越好
  const combined = WX_KEYS.map(k => male[k] + female[k]);
  const avg = combined.reduce((a, b) => a + b, 0) / 5;
  const variance = combined.reduce((s, v) => s + (v - avg) ** 2, 0) / 5;
  if (variance <= 1.5) { score += 6; reasons.push('双方五行合璧均衡'); }
  else if (variance <= 3) { score += 3; reasons.push('五行分布较均'); }

  // 五行齐全加分
  const mComplete = Object.values(male).every(v => v > 0);
  const fComplete = Object.values(female).every(v => v > 0);
  if (mComplete && fComplete) { score += 4; reasons.push('双方五行齐全'); }
  else if (mComplete || fComplete) { score += 2; reasons.push('一方五行齐全'); }

  score = Math.max(0, Math.min(30, score));
  return { score, desc: reasons.length > 0 ? reasons.join('，') : '五行分布正常' };
}

// ── 维度2：日干关系 (满分25) ──────────────────────
// 天干五合：甲己合土、乙庚合金、丙辛合水、丁壬合木、戊癸合火
const WUHE: Record<string, string> = { '甲': '己', '乙': '庚', '丙': '辛', '丁': '壬', '戊': '癸',
                                  '己': '甲', '庚': '乙', '辛': '丙', '壬': '丁', '癸': '戊' };
// 天干相生
const GAN_SHENG: Record<string, string> = { '甲': '丙', '乙': '丙', '丙': '戊', '丁': '戊', '戊': '庚', '己': '庚', '庚': '壬', '辛': '壬', '壬': '甲', '癸': '甲' };

function calcDayMasterRelation(mGan: string, mWx: string, fGan: string, fWx: string): { score: number; desc: string } {
  if (WUHE[mGan] === fGan) {
    return { score: 25, desc: `「${mGan}${fGan}」天干五合，中和吉利` };
  }

  const YANG_GAN = new Set(['甲', '丙', '戊', '庚', '壬']);
  const isYangM = YANG_GAN.has(mGan);
  const isYangF = YANG_GAN.has(fGan);
  if (isYangM !== isYangF) {
    if (GAN_SHENG[mGan] === fGan) {
      return { score: 20, desc: `「${mGan}」生「${fGan}」，阴阳相生` };
    }
    if (GAN_SHENG[fGan] === mGan) {
      return { score: 18, desc: `「${fGan}」生「${mGan}」，阴阳相生` };
    }
    if (mWx === fWx) {
      return { score: 16, desc: `同属${mWx}，阴阳调和` };
    }
    return { score: 12, desc: '阴阳异性的基础和谐' };
  }

  if (mWx === fWx) {
    return { score: 10, desc: `同属${mWx}，同性相帮` };
  }
  if (GAN_SHENG[mGan] === fGan) {
    return { score: 11, desc: `「${mGan}」生「${fGan}」` };
  }
  if (GAN_SHENG[fGan] === mGan) {
    return { score: 9, desc: `「${fGan}」生「${mGan}」` };
  }

  return { score: 6, desc: `「${mGan}」「${fGan}」无特殊冲合` };
}

// ── 维度3：生肖相合 (满分20) ──────────────────────
// 六合：子丑合土、寅亥合木、卯戌合火、辰酉合金、巳申合水、午未合火
const LIUHE: Record<string, string> = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };
// 三合：申子辰水局、寅午戌火局、巳酉金金局、亥卯未木局
const SANHE: Record<string, string[]> = { '申': ['子', '辰'], '子': ['申', '辰'], '辰': ['申', '子'], '寅': ['午', '戌'], '午': ['寅', '戌'], '戌': ['寅', '午'], '巳': ['酉'], '酉': ['巳'], '亥': ['卯', '未'], '卯': ['亥', '未'], '未': ['亥', '卯'] };
// 六冲：子午冲、丑未冲、寅申冲、卯酉冲、辰戌冲、巳亥冲
const LIUCHONG: Record<string, string> = { '子': '午', '午': '子', '丑': '未', '未': '丑', '寅': '申', '申': '寅', '卯': '酉', '酉': '卯', '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳' };
// 六害：子未害、丑午害、寅亥害、卯申害、辰酉害、戌卯害
const LIUHAI: Record<string, string> = { '子': '未', '未': '子', '丑': '午', '午': '丑', '寅': '亥', '亥': '寅', '辰': '酉', '酉': '辰', '戌': '卯', '卯': '戌' };

function calcZodiacRelation(mZhi: string, fZhi: string): { score: number; desc: string } {
  if (LIUHE[mZhi] === fZhi) return { score: 20, desc: `「${mZhi}${fZhi}」六合，最吉` };
  if (SANHE[mZhi]?.includes(fZhi)) return { score: 16, desc: `「${mZhi}${fZhi}」三合，大吉` };
  if (mZhi === fZhi) return { score: 11, desc: `同生肖${mZhi}，性格相近` };
  if (LIUHAI[mZhi] === fZhi) return { score: 6, desc: `「${mZhi}${fZhi}」六害，有小碍` };
  if (LIUCHONG[mZhi] === fZhi) return { score: 3, desc: `「${mZhi}${fZhi}」六冲，需磨合` };
  return { score: 10, desc: `「${mZhi}」「${fZhi}」无特殊冲合` };
}

// ── 维度4：日主强弱平衡 (满分15) ─────────────────
function calcDayMasterBalance(male: BaziInfo, female: BaziInfo): { score: number; desc: string } {
  // 计算日主得令强弱（简化版：统计同五行和生助五行的数量）
  function getStrength(info: BaziInfo): number {
    const dwx = info.dayMasterWuxing;
    const sheng: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
    let support = 0;
    const pillars = [info.chart.year, info.chart.month, info.chart.day];
    if (info.chart.hour) pillars.push(info.chart.hour);
    for (const p of pillars) {
      if (p.ganWuxing === dwx || p.zhiWuxing === dwx) support += 2; // 同五行
      if (p.ganWuxing === sheng[dwx] || p.zhiWuxing === sheng[dwx]) support += 1; // 生助
    }
    return support;
  }

  const mStr = getStrength(male);
  const fStr = getStrength(female);
  const diff = Math.abs(mStr - fStr);

  if (diff >= 3 && diff <= 6) return { score: 15, desc: '日主一强一弱，刚柔并济' };
  if (diff <= 2) return { score: 10, desc: '日主强度相近，性格类似' };
  if (diff <= 9) return { score: 6, desc: '日主强度差异较大' };
  return { score: 3, desc: '日主强度悬殊，需互相包容' };
}

// ── 维度5：神煞参考 (满分10) ─────────────────────
function calcShenSha(male: BaziInfo, female: BaziInfo): { score: number; desc: string } {
  // 天乙贵人查找（简化版）
  const GUIREN: Record<string, string[]> = {
    '甲': ['丑', '未'], '乙': ['子', '申'], '丙': ['亥', '酉'], '丁': ['亥', '酉'],
    '戊': ['丑', '未'], '己': ['子', '申'], '庚': ['丑', '未'], '辛': ['寅', '午'],
    '壬': ['卯', '巳'], '癸': ['卯', '巳'],
  };

  let score = 3;
  const benefits: string[] = [];

  const fPillars = [female.chart.year.zhi, female.chart.month.zhi, female.chart.day.zhi];
  if (female.chart.hour) fPillars.push(female.chart.hour.zhi);
  const mGuiRens = GUIREN[male.dayMasterGan] || [];
  for (const zhi of fPillars) {
    if (mGuiRens.includes(zhi)) { score += 4; benefits.push('女带贵人'); break; }
  }
  const fGuiRens = GUIREN[female.dayMasterGan] || [];
  const mPillars = [male.chart.year.zhi, male.chart.month.zhi, male.chart.day.zhi];
  if (male.chart.hour) mPillars.push(male.chart.hour.zhi);
  for (const zhi of mPillars) {
    if (fGuiRens.includes(zhi)) { score += 3; benefits.push('男带贵人'); break; }
  }

  score = Math.min(10, Math.max(0, score));
  return { score, desc: benefits.length > 0 ? benefits.join('+') : '无明显神煞' };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { maleName, maleBirthDate, maleBirthHour, femaleName, femaleBirthDate, femaleBirthHour } = await req.json();

  // 计算双方八字（完整版）
  const maleInfo = calculateFullBazi(maleBirthDate, maleBirthHour);
  const femaleInfo = calculateFullBazi(femaleBirthDate, femaleBirthHour);

  const maleBazi = formatBazi(maleInfo);
  const femaleBazi = formatBazi(femaleInfo);

  // 基于算法计算匹配度
  const { score, hearts, level, details, _debug } = calculateScore(maleInfo, femaleInfo);

  // 缓存 key
  const cacheKey = generateCacheKey('marriage', { 
    male: maleBazi, 
    female: femaleBazi 
  });
  
  // 检查缓存
  const cached = await getCache(cacheKey);
  if (cached) {
    return NextResponse.json({
      score,
      hearts,
      level,
      maleBazi,
      femaleBazi,
      analysis: cached.analysis,
      _debug,
      disclaimer: '⚠️ 仅供参考，匹配度评分基于五行互补、日干关系、生肖相合等传统命理算法，不代表真实命运。人生幸福取决于彼此的理解与经营。',
      _source: 'cache',
    });
  }

  // AI 分析
  const prompt = `你是"赛博命理师"的八字合婚分析功能。

男方信息：
- 姓名：${maleName || '男方'}
- 出生日期：${maleBirthDate}
- 八字：${maleBazi}

女方信息：
- 姓名：${femaleName || '女方'}
- 出生日期：${femaleBirthDate}
- 八字：${femaleBazi}

匹配度评分：${score}分（${level}）
算法维度：
${details.join('\n')}

请给出200-300字的合婚分析，包括：
1. 性格匹配分析
2. 感情运势分析
3. 相处建议

语气温和、积极、有建设性。直接开始分析，不要有前言。`;

  let analysis = '';
  let aiSource: string = 'fallback';
  try {
    const aiResponse = await fetch('https://api.modelverse.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3.2',
        max_tokens: 600,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      analysis = aiData.choices?.[0]?.message?.content || '分析生成失败';
      aiSource = 'deepseek';
      await setCache(cacheKey, { analysis });
    }
  } catch (err) {
    console.error('AI call failed:', err);
    analysis = '根据双方八字，你们的匹配度较好，建议多沟通、互相理解。';
    aiSource = 'fallback';
  }

  return NextResponse.json({
    score,
    hearts,
    level,
    maleBazi,
    femaleBazi,
    analysis,
    _debug,
    disclaimer: '⚠️ 仅供参考，匹配度评分基于五行互补、日干关系、生肖相合等传统命理算法，不代表真实命运。人生幸福取决于彼此的理解与经营。',
    _source: aiSource,
  });
}
