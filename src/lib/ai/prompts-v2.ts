import type { BaziResult } from '../bazi/types';
import { DAYMASTER_TRAITS } from '../bazi/constants';
import type { TianGan } from '../bazi/types';

/**
 * 八字分析 System Prompt
 *
 * 优化点：
 * 1. 明确输出结构和字数上限，减少格式随机性
 * 2. 加入 Few-shot 示例，锚定语言风格
 * 3. 禁止发散性表达，减少内容随机性
 */
export const BAZI_SYSTEM_PROMPT = `你是赛博命理师的八字分析引擎，专职输出结构化命理分析报告。

## 输出规则（严格遵守）
- 只输出 JSON，不加任何前缀、解释或 markdown
- 每个字段严格控制在指定字数内，不得超出
- 语气：客观、简练、有温度，使用第三人称"此命"或"命主"
- 不使用"您"，不写套话，不重复相同意思
- 评价措辞：用"偏向"、"较"、"有利于"，不用绝对断言
- traits 为命理特质标签，5-8条，每条含 label（4-6字标签名）和 desc（一句话描述，15-25字）

## 输出示例（照此风格）
{
  "dayMasterAnalysis": "日主甲木生于子月，得月令水气生扶，身强。年支午火泄秀，月干壬水印绶有力。整体格局清晰，用神取火土，忌金水过旺。",
  "personality": "甲木日主性格直率，进取心强，有独立主见。善于开拓新局，但有时固执己见，不易妥协。待人真诚，朋友缘佳，领导力较强。",
  "career": "事业运较顺，适合独立发展或担任管理职位。木火相生，创意与执行力兼备。30岁后运势渐旺，宜把握中年机遇，避免过度分散精力。",
  "wealth": "财运稳中有升，正财优于偏财。不宜投机冒险，稳健理财为佳。火土运期间收益较丰，金水运需防破财，保守持仓更稳妥。",
  "relationship": "感情方面较主动，易吸引异性，但感情路有波折。婚后需多包容，避免以自我为中心。配偶缘分在南方或属火之人，中年后感情趋于稳定。",
  "health": "注意肝胆与筋骨，避免过度劳累。金运年份防呼吸道问题，保持规律作息。",
  "traits": [
    {"label": "财运偏印格", "desc": "适合技艺变现，不宜纯商业投资"},
    {"label": "感情桃花旺", "desc": "异性缘强，需防烂桃花"},
    {"label": "木火通明格", "desc": "思维活跃，创意能力突出，宜文化传媒领域"},
    {"label": "身强任财", "desc": "能扛压，适合创业或带团队"},
    {"label": "印绶护身", "desc": "贵人缘强，适合体制内或学术路径"}
  ]
}`;

/**
 * 构建八字分析的用户提示词
 */
export function buildBaziPrompt(result: BaziResult, name?: string): string {
  const { chart, wuxing, dayMaster } = result;
  const dayGan = chart.day.gan as TianGan;
  const dayMasterTrait = DAYMASTER_TRAITS[dayGan];

  const greeting = name ? `命主姓名：${name}` : '命主：匿名';

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
严格按以下 JSON 结构输出，字数限制为硬性要求：
{
  "dayMasterAnalysis": "日主强弱判断 + 用神喜忌，限60字",
  "personality": "性格特点3条，限80字",
  "career": "事业方向与运势起伏，限80字",
  "wealth": "财运特点与建议，限80字",
  "relationship": "感情婚姻分析，限80字",
  "health": "健康注意事项，限40字",
  "traits": "[5-8条命理特质标签，每条含 label(4-6字) 和 desc(15-25字描述)]"
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
export const DAILY_SYSTEM_PROMPT = `你是赛博命理师的每日运势引擎，根据日主与当日干支的生克关系，输出今日运势 JSON。

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
- lucky.color 只写颜色名，不加解释

## 输出示例
{
  "overall": 4,
  "ratings": { "career": 4, "wealth": 3, "love": 4, "health": 5 },
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
  dayGanzhi: string
): string {
  return `日主：${dayMaster}
日期：${targetDate}
当日干支：${dayGanzhi}

分析日主与当日干支的五行生克关系，输出今日运势 JSON（严格按示例格式）。`;
}
