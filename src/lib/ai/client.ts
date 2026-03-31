import { buildBaziPrompt, buildDailyPrompt, BAZI_SYSTEM_PROMPT, DAILY_SYSTEM_PROMPT } from './prompts';
import type { BaziResult, BaziAnalysis } from '../bazi/types';
import { callExternalAPI, getEnvVar } from '../utils/api-wrapper';

const DEEPSEEK_BASE_URL = 'https://api.modelverse.cn/v1';
const DEEPSEEK_MODEL = 'deepseek-ai/DeepSeek-V3.2';

async function callDeepSeek(systemPrompt: string, userPrompt: string, maxTokens = 800): Promise<string> {
  const apiKey = getEnvVar('DEEPSEEK_API_KEY');
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY 未配置');

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * 生成八字分析（带降级策略）
 * 返回值包含 _source 字段：'deepseek' | 'fallback'
 */
export async function generateBaziAnalysis(
  result: BaziResult,
  name?: string
): Promise<BaziAnalysis & { _source: 'deepseek' | 'fallback' }> {
  const apiKey = getEnvVar('DEEPSEEK_API_KEY');
  if (!apiKey) {
    console.warn('[AI] DEEPSEEK_API_KEY 未配置，使用降级分析');
    return { ...generateFallbackBaziAnalysis(result), _source: 'fallback' };
  }

  const prompt = buildBaziPrompt(result, name);

  const apiResult = await callExternalAPI(
    async () => {
      const text = await callDeepSeek(BAZI_SYSTEM_PROMPT, prompt, 800);
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

  if (apiResult.success) {
    return { ...apiResult.data, _source: 'deepseek' };
  }
  return { ...generateFallbackBaziAnalysis(result), _source: 'fallback' };
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
 * 返回值包含 _source 字段：'deepseek' | 'fallback'
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
  _source: 'deepseek' | 'fallback';
}> {
  const apiKey = getEnvVar('DEEPSEEK_API_KEY');
  if (!apiKey) {
    console.warn('[AI] DEEPSEEK_API_KEY 未配置，使用降级运势');
    return { ...generateFallbackDailyFortune(), _source: 'fallback' };
  }

  const prompt = buildDailyPrompt(dayMaster, targetDate, dayGanzhi);

  const apiResult = await callExternalAPI(
    async () => {
      const text = await callDeepSeek(DAILY_SYSTEM_PROMPT, prompt, 600);
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

  if (apiResult.success) {
    return { ...apiResult.data, _source: 'deepseek' };
  }
  return { ...generateFallbackDailyFortune(), _source: 'fallback' };
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
