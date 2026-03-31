import type { BaziResult } from '../bazi/types';
import { DAYMASTER_TRAITS } from '../bazi/constants';
import type { TianGan } from '../bazi/types';

/**
 * 构建八字分析的系统提示词
 */
export const BAZI_SYSTEM_PROMPT = `你是一位专业的命理分析师，精通八字命理学。
你的任务是根据用户提供的八字信息，给出专业、客观、有建设性的分析。

分析原则：
1. 基于五行生克、十神关系进行分析
2. 语言要专业但易懂，适合普通用户阅读
3. 避免绝对化的断言，使用"倾向于"、"可能"、"有利于"等词
4. 给出积极的建议和指导，避免消极悲观的表述
5. 每个部分控制在 80-120 字左右

你必须严格按照 JSON 格式输出，不要有任何其他内容。`;

/**
 * 构建八字分析的用户提示词
 */
export function buildBaziPrompt(result: BaziResult, name?: string): string {
  const { chart, wuxing, dayMaster } = result;
  const dayGan = chart.day.gan as TianGan;
  const dayMasterTrait = DAYMASTER_TRAITS[dayGan];
  
  const greeting = name ? `用户姓名：${name}` : '用户未提供姓名';
  
  const hourInfo = chart.hour 
    ? `时柱：${chart.hour.gan}${chart.hour.zhi}（${chart.hour.ganWuxing}${chart.hour.zhiWuxing}）`
    : '时柱：未知';
  
  return `${greeting}

八字命盘：
年柱：${chart.year.gan}${chart.year.zhi}（${chart.year.ganWuxing}${chart.year.zhiWuxing}）
月柱：${chart.month.gan}${chart.month.zhi}（${chart.month.ganWuxing}${chart.month.zhiWuxing}）
日柱：${chart.day.gan}${chart.day.zhi}（${chart.day.ganWuxing}${chart.day.zhiWuxing}）
${hourInfo}

日主：${dayMaster}
日主特征：${dayMasterTrait}

五行统计：
金：${wuxing.metal}
木：${wuxing.wood}
水：${wuxing.water}
火：${wuxing.fire}
土：${wuxing.earth}

请分析此八字，输出 JSON 格式：
{
  "dayMasterAnalysis": "日主分析，包括身强身弱判断（约100字）",
  "personality": "性格特点分析（约100字）",
  "career": "事业运势分析（约100字）",
  "wealth": "财运分析（约100字）",
  "relationship": "感情婚姻分析（约100字）",
  "health": "健康提示（约50字）"
}`;
}

/**
 * 构建每日运势的系统提示词
 */
export const DAILY_SYSTEM_PROMPT = `你是一位专业的命理分析师，擅长分析每日运势。
根据用户的八字和当日干支，给出今日运势分析。

分析原则：
1. 结合日主和当日干支的关系
2. 给出实用的建议
3. 保持积极正面的态度
4. 控制总字数在 200 字以内

你必须严格按照 JSON 格式输出，不要有任何其他内容。`;

/**
 * 构建每日运势的用户提示词
 */
export function buildDailyPrompt(
  dayMaster: string,
  targetDate: string,
  dayGanzhi: string
): string {
  return `用户日主：${dayMaster}
目标日期：${targetDate}
当日干支：${dayGanzhi}

请分析今日运势，输出 JSON 格式：
{
  "overall": 4,
  "ratings": {
    "career": 4,
    "wealth": 3,
    "love": 4,
    "health": 5
  },
  "suitable": ["适宜做的事情1", "适宜做的事情2", "适宜做的事情3"],
  "avoid": ["不宜做的事情1", "不宜做的事情2"],
  "lucky": {
    "color": "幸运颜色",
    "numbers": [3, 8],
    "direction": "幸运方位"
  },
  "advice": "今日建议（约50字）"
}

评分说明：1-5分，5分最高
overall: 今日整体运势
ratings: 各分项运势（事业、财运、感情、健康）`;
}
