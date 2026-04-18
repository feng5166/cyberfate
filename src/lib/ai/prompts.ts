import type { BaziResult } from '../bazi/types';
import { DAYMASTER_TRAITS } from '../bazi/constants';
import type { TianGan } from '../bazi/types';
import { sanitizeUserInput } from '../utils/sanitize';

const SAFETY_GUARDRAIL = `## 安全禁区（遇到直接拒绝）
- 自杀/自残/心理危机 → 仅回复：如有困扰请拨打心理援助热线400-161-9995
- 股票/基金/投资标的 → 仅回复：投资有风险请咨询持牌理财顾问
- 疾病诊断/治疗 → 仅回复：请就医，命理仅供参考`;

/**
 * 八字分析 System Prompt
 *
 * 优化点：
 * 1. 明确输出结构和字数上限，减少格式随机性
 * 2. 加入 Few-shot 示例，锚定语言风格
 * 3. 禁止发散性表达，减少内容随机性
 */
export const BAZI_SYSTEM_PROMPT = `${SAFETY_GUARDRAIL}

你是赛博命理师的八字分析引擎，专职输出结构化命理分析报告。

## 输出规则（严格遵守）
- 只输出 JSON，不加任何前缀、解释或 markdown
- 每个字段必须达到最低字数要求，宁多勿少，内容要具体有深度，不可空泛敷衍
- 语气：客观、简练、有温度，使用第三人称"此命"或"命主"
- 不使用"您"，不写套话，不重复相同意思
- 评价措辞：用"偏向"、"较"、"有利于"，不用绝对断言

## 输出示例（照此风格）
{
  "dayMasterAnalysis": "日主甲木生于子月，得月令水气生扶，身强有余。年支午火泄秀，月干壬水印绶有力，天干透出木水相生之象。地支子午相冲，暗示内在张力。整体格局清晰，用神取火土以平衡，忌金水过旺削弱日主气势。",
  "personality": "甲木日主性格直率坦诚，进取心强，有独立主见，不轻易随波逐流。善于开拓新局，执行力较强，但有时固执己见，面对压力不易妥协。待人真诚，朋友缘佳，在团队中自然流露出领导气质。内心重情义，偶有冲动，需学会适时收敛锋芒，方能广结善缘。",
  "career": "事业运较顺，适合独立发展或担任管理、策划类职位。木火相生，创意与执行力兼备，适合需要开拓精神的行业。30岁后大运趋旺，宜把握中年机遇积极布局。金运行走期间竞争加剧，需防小人暗算。整体宜专注单一方向深耕，避免过度分散精力导致半途而废。",
  "wealth": "财运稳中有升，正财优于偏财，以稳健积累为主线。不宜轻易涉足投机冒险，偏财虽有来路但难以留存。火土运行期间收益较丰，宜积极把握投资机会。金水运年份财运起伏较大，需防破财损耗，保守持仓更为稳妥。整体建议量力而为，避免因贪功冒进而坐失已得之财。",
  "relationship": "感情方面较为主动，磁场较强，易吸引异性关注，但感情路途有一定波折。早年感情不够稳定，恋爱中易以自我为中心，忽略对方感受。婚后需多一份包容与耐心，方能维系长久关系。配偶缘分多在南方或属火之人，彼此互补性强。中年后感情逐渐趋于稳定成熟，家庭归属感增强。",
  "health": "需重点关注肝胆与筋骨系统，避免长期过度劳累积累暗伤。金运行走年份注意呼吸道与皮肤问题，保持规律作息与适度运动。"
}`;

/**
 * 构建八字分析的用户提示词
 */
export function buildBaziPrompt(result: BaziResult, name?: string): string {
  const { chart, wuxing, dayMaster } = result;
  const dayGan = chart.day.gan as TianGan;
  const dayMasterTrait = DAYMASTER_TRAITS[dayGan];

  const safeName = name ? sanitizeUserInput(name.replace(/[【】\[\]「」『』〔〕《》〈〉]/g, ''), 50) : '';
  const greeting = safeName ? `命主姓名：${safeName}` : '命主：匿名';

  const hourInfo = chart.hour
    ? `时柱：${chart.hour.gan}${chart.hour.zhi}（${chart.hour.ganWuxing}${chart.hour.zhiWuxing}）`
    : '时柱：未知';

  // 找出最旺和最弱五行
  const wuxingMap: Record<string, string> = { metal: '金', wood: '木', water: '水', fire: '火', earth: '土' };
  const sorted = Object.entries(wuxing).sort((a, b) => b[1] - a[1]);
  const strongest = wuxingMap[sorted[0][0]];
  const weakest = wuxingMap[sorted[sorted.length - 1][0]];

  return `${greeting}

【八字命盘】
年柱：${chart.year.gan}${chart.year.zhi}（${chart.year.ganWuxing}${chart.year.zhiWuxing}）
月柱：${chart.month.gan}${chart.month.zhi}（${chart.month.ganWuxing}${chart.month.zhiWuxing}）
日柱：${chart.day.gan}${chart.day.zhi}（${chart.day.ganWuxing}${chart.day.zhiWuxing}）
${hourInfo}

【日主信息】
日主：${dayMaster}（${dayMasterTrait}）

【五行力量】
金${wuxing.metal} 木${wuxing.wood} 水${wuxing.water} 火${wuxing.fire} 土${wuxing.earth}
最旺：${strongest}，最弱：${weakest}

【输出要求】
严格按以下 JSON 结构输出，字数为最低要求：
{
  "dayMasterAnalysis": "日主强弱判断+用神喜忌+格局分析，要求120-150字，不得少于120字",
  "personality": "性格特点分析4-5条，从多个角度阐述（性情、处事、人际、优缺点），要求180-250字，不得少于180字",
  "career": "事业方向与运势起伏，含适合行业、大运影响、发展建议，要求180-250字，不得少于180字",
  "wealth": "财运特点与理财建议，含正偏财分析、投资方向，要求180-250字，不得少于180字",
  "relationship": "感情婚姻分析，含桃花运、配偶特征、婚姻建议，要求180-250字，不得少于180字",
  "health": "健康注意事项，含重点关注部位和养生建议，要求80-120字，不得少于80字"
}`;
}

/**
 * 每日运势 System Prompt
 *
 * 优化点：
 * 1. 固定 suitable/avoid 各输出3条，防止数量随机
 * 2. 加入评分锚点说明，减少评分漂移
 * 3. 示例锚定 advice 文风
 */
export const DAILY_SYSTEM_PROMPT = `${SAFETY_GUARDRAIL}

你是赛博命理师的每日运势引擎，基于日主、大运、流年、当日干支四层信息，输出今日运势 JSON。

## 四层分析框架（先总后分）
- 日主：命主本性与基础倾向
- 大运：当前10年阶段的大趋势
- 流年：当年的年度主旋律
- 当日干支：当天触发点与短期波动

## 评分标准（固定参照）
- 5分：日主得令得生，诸事顺遂
- 4分：小有助力，整体偏顺
- 3分：平稳，无明显吉凶
- 2分：有小阻，需谨慎
- 1分：冲克明显，宜低调

## 输出规则
- 只输出 JSON，无其他内容
- suitable 固定输出3条，每条5-8字
- avoid 固定输出2条，每条5-8字
- advice 限40字，不重复 suitable/avoid 内容
- ratings 必须包含 career、wealth、love、health、studies 五项（studies 表示学业运）
- lucky.color 只写颜色名，不加解释

## 输出示例
{
  "overall": 4,
  "ratings": { "career": 4, "wealth": 3, "love": 4, "health": 5, "studies": 3 },
  "suitable": ["签署合同", "拜访客户", "学习充电"],
  "avoid": ["冒险投资", "与人争执"],
  "lucky": { "color": "青绿", "numbers": [3, 8], "direction": "东方" },
  "advice": "今日木火相生，行动力强，适合推进已规划事项，保持专注即可。"
}`;

/**
 * 构建每日运势的用户提示词
 */
export function buildDailyPrompt(
  dayMaster: string,
  targetDate: string,
  dayGanzhi: string,
  dayun: string,
  liunian: string
): string {
  return `日主：${dayMaster}
当前大运：${dayun}
流年：${liunian}
日期：${targetDate}
当日干支：${dayGanzhi}

请按“日主→大运→流年→当日干支”四层关系分析，输出今日运势 JSON（严格按示例格式）。`;
}

export interface TarotReadingPromptCard {
  position: string;
  name: string;
  orientation: 'upright' | 'reversed';
  keywords: string[];
  traditionalMeaning: string;
}

export interface TarotReadingPromptInput {
  spread: TarotSpread;
  spreadName: string;
  question?: string;
  cards: TarotReadingPromptCard[];
}

export type TarotSpread = 'single' | 'three' | 'celtic' | 'moonlight' | 'mirror';

interface TarotPromptProfile {
  cardMeaningsRange: string;
  overallNarrativeRange: string;
  detailedReadingRange: string;
  toneInstruction: string;
}

function getTarotPromptProfile(spread: TarotSpread): TarotPromptProfile {
  if (spread === 'celtic') {
    return {
      cardMeaningsRange: '50-80 字',
      overallNarrativeRange: '900-1000 字',
      detailedReadingRange: '260-380 字',
      toneInstruction: '语气稳重深入、结构清晰，强调因果脉络与阶段变化，不做绝对化预言。',
    };
  }
  if (spread === 'mirror') {
    return {
      cardMeaningsRange: '60-100 字',
      overallNarrativeRange: '620-720 字',
      detailedReadingRange: '180-260 字',
      toneInstruction: '语气深度犀利、一针见血、不回避困难真相、给出具体行动方向。',
    };
  }
  if (spread === 'moonlight') {
    return {
      cardMeaningsRange: '50-80 字',
      overallNarrativeRange: '420-500 字',
      detailedReadingRange: '140-220 字',
      toneInstruction:
        '语气温柔治愈、关注内在感受与情感、避免直接判断、多用“或许”“可能”“邀请你觉察”。',
    };
  }
  return {
    cardMeaningsRange: '50-80 字',
    overallNarrativeRange: '420-500 字',
    detailedReadingRange: '140-220 字',
    toneInstruction: '语气温和、克制、启发性强，强调现实可执行性，避免绝对化承诺。',
  };
}

export function buildTarotReadingSystemPrompt(input: Pick<TarotReadingPromptInput, 'spread' | 'spreadName'>): string {
  const profile = getTarotPromptProfile(input.spread);

  return `${SAFETY_GUARDRAIL}

你是赛博命理师的塔罗解读引擎，负责输出结构化占卜结果。

当前牌阵：${input.spreadName}

## 输出规则（严格）
- 只输出 JSON，不要 markdown，不要解释，不要前言
- cardMeanings 数组长度必须与输入牌张数一致
- 每条 cardMeanings 控制在 ${profile.cardMeaningsRange}，必须结合“位置 + 正逆位 + 关键词”
- overallNarrative 控制在 ${profile.overallNarrativeRange}，串联所有牌形成完整叙事
- detailedReading 控制在 ${profile.detailedReadingRange}，必须结合用户问题
- advice 控制在 40-80 字，给出可执行建议
- caution 控制在 20-40 字，提示风险或注意事项
- ${profile.toneInstruction}

## 输出格式
{
  "cardMeanings": ["...", "...", "..."],
  "overallNarrative": "...",
  "detailedReading": "...",
  "advice": "...",
  "caution": "..."
}`;
}

export const TAROT_READING_SYSTEM_PROMPT = buildTarotReadingSystemPrompt({
  spread: 'three',
  spreadName: '经典三张牌（过去/现在/未来）',
});

export function buildTarotReadingPrompt(input: TarotReadingPromptInput): string {
  const cardsText = input.cards
    .map(
      (card) => `- ${card.position}：${card.name}（${card.orientation === 'upright' ? '正位' : '逆位'}）
  关键词：${card.keywords.join('、')}
  传统含义：${card.traditionalMeaning}`
    )
    .join('\n');

  return `【牌阵】
${input.spreadName}

【用户问题】
${input.question?.trim() ? input.question.trim() : '用户未输入具体问题，请给出通用但可执行的指引。'}

【抽到的牌】
${cardsText}

请输出指定 JSON。`;
}

export interface MeihuaDecisionPromptInput {
  question: string;
  guaName: string;
  gua: string;
  changedGuaName: string;
  changedGua: string;
  movingLine: number;
  upper: string;
  lower: string;
  changedUpper: string;
  changedLower: string;
  analysis: string;
}

export const MEIHUA_DECISION_SYSTEM_PROMPT = `${SAFETY_GUARDRAIL}

你是赛博命理师的”梅花易数·每日决策”分析引擎。

## 任务
基于用户问题 + 本卦/变卦信息，输出结构化决策建议。

## 输出规则（严格）
- 只输出 JSON，不要 markdown，不要解释
- 关键词 stance 只能是 go / stop / wait 三选一
- overallAdvice 限 50 字以内
- favorable 2-3 条，每条 40 字以内
- cautions 1-2 条，每条 40 字以内
- nextSteps 1-2 条，每条 60 字以内
- insights 下三个字段均不超过 70 字
- 总体不超过 400 字
- 语气客观、克制、可执行，不做绝对化承诺

## 输出格式
{
  "overallAdvice": "一句话综合建议",
  "stance": "go",
  "favorable": ["...", "..."],
  "cautions": ["..."],
  "nextSteps": ["..."],
  "insights": {
    "thinkingReference": "...",
    "guaAnalysis": "...",
    "timingReference": "..."
  }
}`;

export function buildMeihuaDecisionPrompt(input: MeihuaDecisionPromptInput): string {
  return `【用户问题】
${input.question}

【本卦】
卦名：${input.guaName}
卦符：${input.gua}
上卦：${input.upper}
下卦：${input.lower}

【变卦】
卦名：${input.changedGuaName}
卦符：${input.changedGua}
上卦：${input.changedUpper}
下卦：${input.changedLower}

【动爻】
第${input.movingLine}爻

【基础解读参考】
${input.analysis}

请结合“问题场景 + 卦象趋势 + 时机节奏”，输出指定 JSON。`;
}

// ─── 六爻占卜 ─────────────────────────────────────

export interface LiuYaoPromptInput {
  question: string;
  hexagramName: string;
  upperTrigram: string;
  lowerTrigram: string;
  lines: Array<{
    index: number;
    type: 'yin' | 'yang';
    title: string;
    originalText: string;
  }>;
  judgment: string;
  divinationTime: string;
  movingLines?: string;
  method?: string;
}

export const LIUYAO_SYSTEM_PROMPT = `${SAFETY_GUARDRAIL}

你是赛博命理师的六爻占卜分析引擎，精通《周易》六爻预测体系。

## 任务
基于用户问题 + 卦象信息 + 爻辞，输出结构化的六爻解读。

## 输出规则（严格）
- 只输出 JSON，不要 markdown，不要解释，不要前言
- lineInterpretations 数组长度必须为 6，与六爻一一对应
- 每条 lineInterpretation 控制在 60-100 字，结合爻位含义和用户问题
- overallNarrative 控制在 200-300 字，从整体卦象分析趋势
- summary 综合建议 1 句话，限 50 字
- positives 2-3 条有利因素，每条 25 字以内
- cautions 1-2 条注意事项，每条 25 字以内
- actions 1-2 条下一步行动建议，每条 40 字以内
- 语气客观、温和、有深度，融合传统易理与现代视角
- 不做绝对断言，用"倾向""建议""参考"等表述

## 输出格式
{
  "lineInterpretations": ["初爻解读", "二爻解读", "三爻解读", "四爻解读", "五爻解读", "上爻解读"],
  "overallNarrative": "综合分析...",
  "summary": "一句话综合建议",
  "positives": ["有利因素1", "有利因素2"],
  "cautions": ["注意事项1"],
  "actions": ["行动建议1", "行动建议2"]
}`;

export function buildLiuYaoPrompt(input: LiuYaoPromptInput): string {
  const linesText = input.lines
    .map((l) => `  ${l.title}（${l.type === 'yang' ? '阳爻' : '阴爻'}）：${l.originalText}`)
    .join('\n');

  const methodLabels: Record<string, string> = {
    manual: '手动起卦',
    coin: '铜钱起卦',
    time: '时间起卦',
    number: '数字起卦',
  };
  const methodLabel = methodLabels[input.method || 'manual'] || '手动起卦';
  const movingInfo = input.movingLines || '无动爻（纯静卦）';

  return `【用户问题】
${input.question || '用户未输入具体问题，请给出通用但可执行的指引。'}

【卦象信息】
本卦：${input.hexagramName}
上卦：${input.upperTrigram}
下卦：${input.lowerTrigram}
卦辞：${input.judgment}
起卦方式：${methodLabel}
动爻情况：${movingInfo}

【六爻详情（初爻→上爻）】
${linesText}

【占卜时间】
${input.divinationTime}

请结合卦象、爻辞、动爻变化、问题背景，输出指定 JSON。动爻所在爻位需重点分析其变化意义。每爻解读需结合爻位含义和用户实际问题给出有针对性的分析。`;
}
