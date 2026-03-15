import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { buildBaziPrompt, buildDailyPrompt, BAZI_SYSTEM_PROMPT, DAILY_SYSTEM_PROMPT } from './prompts';
import type { BaziResult, BaziAnalysis } from '../bazi/types';
import { callExternalAPI, getEnvVar } from '../utils/api-wrapper';

/**
 * 生成八字分析（带降级策略）
 */
export async function generateBaziAnalysis(
  result: BaziResult,
  name?: string
): Promise<BaziAnalysis> {
  const apiKey = getEnvVar('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.warn('[AI] ANTHROPIC_API_KEY 未配置，使用降级分析');
    return generateFallbackBaziAnalysis(result);
  }

  const prompt = buildBaziPrompt(result, name);
  
  const apiResult = await callExternalAPI(
    async () => {
      const response = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        system: BAZI_SYSTEM_PROMPT,
        prompt,
      });
      
      const text = response.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      return JSON.parse(jsonMatch[0]) as BaziAnalysis;
    },
    {
      serviceName: 'AI 八字分析',
      fallback: generateFallbackBaziAnalysis(result),
    }
  );
  
  return apiResult.success ? apiResult.data : generateFallbackBaziAnalysis(result);
}

function generateFallbackBaziAnalysis(result: BaziResult): BaziAnalysis {
  const { wuxing, dayMaster } = result;
  const wuxingNames: Record<string, string> = {
    metal: '金', wood: '木', water: '水', fire: '火', earth: '土',
  };
  const entries = Object.entries(wuxing) as [keyof typeof wuxing, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const strongest = wuxingNames[sorted[0][0]];
  
  return {
    dayMasterAnalysis: `日主为「${dayMaster}」，五行中${strongest}最旺。`,
    personality: '您性格中有多元的特质，善于适应不同环境。',
    career: '事业方面有发展潜力，建议稳步前进。',
    wealth: '财运方面需要稳健理财。',
    relationship: '感情方面宜真诚相待。',
    health: '注意劳逸结合，保持良好作息。',
  };
}

/**
 * 生成每日运势（带降级策略）
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
  const apiKey = getEnvVar('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.warn('[AI] ANTHROPIC_API_KEY 未配置，使用降级运势');
    return generateFallbackDailyFortune();
  }

  const prompt = buildDailyPrompt(dayMaster, targetDate, dayGanzhi);
  
  const apiResult = await callExternalAPI(
    async () => {
      const response = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        system: DAILY_SYSTEM_PROMPT,
        prompt,
      });
      
      const text = response.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      return JSON.parse(jsonMatch[0]);
    },
    {
      serviceName: 'AI 每日运势',
      fallback: generateFallbackDailyFortune(),
    }
  );
  
  return apiResult.success ? apiResult.data : generateFallbackDailyFortune();
}

function generateFallbackDailyFortune() {
  return {
    overall: 3,
    ratings: { career: 3, wealth: 3, love: 3, health: 4 },
    suitable: ['日常工作', '学习提升', '与朋友交流'],
    avoid: ['重大决策', '冒险投资'],
    lucky: { color: '蓝色', numbers: [3, 6], direction: '东方' },
    advice: '今日运势平稳，宜保持平常心，稳步前进。',
  };
}
