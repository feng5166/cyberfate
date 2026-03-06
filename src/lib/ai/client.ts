import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { buildBaziPrompt, buildDailyPrompt, BAZI_SYSTEM_PROMPT, DAILY_SYSTEM_PROMPT } from './prompts';
import type { BaziResult, BaziAnalysis } from '../bazi/types';

/**
 * 生成八字分析
 */
export async function generateBaziAnalysis(
  result: BaziResult,
  name?: string
): Promise<BaziAnalysis> {
  const prompt = buildBaziPrompt(result, name);
  
  const response = await generateText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: BAZI_SYSTEM_PROMPT,
    prompt,
  });
  
  // 解析 JSON 响应
  try {
    // 尝试从响应中提取 JSON
    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as BaziAnalysis;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    // 返回默认分析
    return {
      dayMasterAnalysis: '根据八字分析，您的日主具有独特的特质。建议结合实际情况综合考量。',
      personality: '您性格中有多元的特质，善于适应不同环境，具有一定的灵活性和韧性。',
      career: '事业方面有发展潜力，建议把握机遇，稳步前进，注重积累和提升。',
      wealth: '财运方面需要稳健理财，避免冲动消费，适当投资可带来回报。',
      relationship: '感情方面宜真诚相待，注重沟通和理解，感情运势稳定。',
      health: '注意劳逸结合，保持良好作息，适当运动。',
    };
  }
}

/**
 * 生成每日运势
 */
export async function generateDailyFortune(
  dayMaster: string,
  targetDate: string,
  dayGanzhi: string
): Promise<{
  overall: number;
  ratings: { career: number; wealth: number; love: number; health: number };
  suitable: string[];
  avoid: string[];
  lucky: { color: string; numbers: number[]; direction: string };
  advice: string;
}> {
  const prompt = buildDailyPrompt(dayMaster, targetDate, dayGanzhi);
  
  const response = await generateText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: DAILY_SYSTEM_PROMPT,
    prompt,
  });
  
  // 解析 JSON 响应
  try {
    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    // 返回默认运势
    return {
      overall: 3,
      ratings: { career: 3, wealth: 3, love: 3, health: 4 },
      suitable: ['日常工作', '学习提升', '与朋友交流'],
      avoid: ['重大决策', '冒险投资'],
      lucky: { color: '蓝色', numbers: [3, 6], direction: '东方' },
      advice: '今日运势平稳，宜保持平常心，稳步前进。',
    };
  }
}
