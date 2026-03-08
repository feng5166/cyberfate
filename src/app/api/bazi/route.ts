import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateBazi } from '@/lib/bazi';
import { generateBaziAnalysis } from '@/lib/ai';
import { useBaziQuota } from '@/lib/quota';
import type { BaziAnalysis } from '@/lib/bazi/types';

// 时辰映射：数字 -> 时辰名称（不含 -1，单独处理）
const HOUR_TO_SHICHEN: Record<number, string> = {
  0: '子时',
  1: '丑时',
  2: '寅时',
  3: '卯时',
  4: '辰时',
  5: '巳时',
  6: '午时',
  7: '未时',
  8: '申时',
  9: '酉时',
  10: '戌时',
  11: '亥时',
};

// 请求体验证
const requestSchema = z.object({
  name: z.string().optional(),
  gender: z.enum(['male', 'female', 'unknown']).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  birthHour: z.number().int().min(-1).max(11),
});

export async function POST(req: NextRequest) {
  try {
    // 检查登录状态和配额
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }
    
    // 检查并使用配额
    const hasQuota = await useBaziQuota(session.user.id);
    
    if (!hasQuota) {
      return Response.json({ 
        error: 'QUOTA_EXCEEDED',
        message: '今日免费解读次数已用完，请升级 VIP'
      }, { status: 403 });
    }
    
    const body = await req.json();
    const input = requestSchema.parse(body);
    
    // 转换时辰（-1 表示不知道，默认午时）
    const shichen = input.birthHour === -1 ? '午时' : (HOUR_TO_SHICHEN[input.birthHour] || '午时');
    
    // 1. 计算八字
    const baziResult = calculateBazi({
      name: input.name,
      gender: input.gender === 'unknown' ? 'male' : (input.gender || 'male'),
      birthDate: input.birthDate,
      birthHour: shichen as '子时' | '丑时' | '寅时' | '卯时' | '辰时' | '巳时' | '午时' | '未时' | '申时' | '酉时' | '戌时' | '亥时' | '不知道',
    });
    
    // 2. AI 解读（可能失败，优雅降级）
    let analysisObj: BaziAnalysis;
    try {
      analysisObj = await generateBaziAnalysis(baziResult, input.name);
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      analysisObj = generateFallbackAnalysis(baziResult);
    }
    
    // 将分析对象转换为可读文本
    const aiAnalysis = formatAnalysis(analysisObj);
    
    // 处理时柱（可能为 null）
    const hourPillar = baziResult.chart.hour || {
      gan: '午',
      zhi: '时',
      ganWuxing: '火',
      zhiWuxing: '火',
    };
    
    // 转换为前端期望的格式
    return Response.json({
      pillars: {
        year: {
          gan: baziResult.chart.year.gan,
          zhi: baziResult.chart.year.zhi,
          ganWuxing: baziResult.chart.year.ganWuxing,
          zhiWuxing: baziResult.chart.year.zhiWuxing,
        },
        month: {
          gan: baziResult.chart.month.gan,
          zhi: baziResult.chart.month.zhi,
          ganWuxing: baziResult.chart.month.ganWuxing,
          zhiWuxing: baziResult.chart.month.zhiWuxing,
        },
        day: {
          gan: baziResult.chart.day.gan,
          zhi: baziResult.chart.day.zhi,
          ganWuxing: baziResult.chart.day.ganWuxing,
          zhiWuxing: baziResult.chart.day.zhiWuxing,
        },
        hour: {
          gan: hourPillar.gan,
          zhi: hourPillar.zhi,
          ganWuxing: hourPillar.ganWuxing,
          zhiWuxing: hourPillar.zhiWuxing,
        },
      },
      wuxing: baziResult.wuxing,
      aiAnalysis,
    });
  } catch (error) {
    console.error('Bazi API error:', error);
    
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: '输入数据格式错误：' + error.issues.map(e => e.message).join(', ') },
        { status: 400 }
      );
    }
    
    return Response.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// 将分析对象格式化为可读文本
function formatAnalysis(analysis: BaziAnalysis): string {
  return `【日主分析】
${analysis.dayMasterAnalysis}

【性格特点】
${analysis.personality}

【事业运势】
${analysis.career}

【财运分析】
${analysis.wealth}

【感情运势】
${analysis.relationship}

【健康提示】
${analysis.health}`;
}

// 降级分析（当 AI 不可用时）
function generateFallbackAnalysis(bazi: ReturnType<typeof calculateBazi>): BaziAnalysis {
  const { wuxing, dayMaster } = bazi;
  
  const wuxingNames: Record<string, string> = {
    metal: '金',
    wood: '木',
    water: '水',
    fire: '火',
    earth: '土',
  };
  
  // 找出最旺和最弱的五行
  const entries = Object.entries(wuxing) as [keyof typeof wuxing, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const strongest = wuxingNames[sorted[0][0]];
  const weakest = sorted[sorted.length - 1][1] === 0 
    ? wuxingNames[sorted[sorted.length - 1][0]]
    : null;
  
  return {
    dayMasterAnalysis: `日主为「${dayMaster}」，五行中${strongest}最旺${weakest ? `，${weakest}较弱或缺失` : ''}。八字整体${sorted[0][1] - sorted[sorted.length - 1][1] <= 2 ? '较为平衡' : '有所偏向'}。`,
    personality: '您性格中有多元的特质，善于适应不同环境，具有一定的灵活性和韧性。',
    career: '事业方面有发展潜力，建议把握机遇，稳步前进，注重积累和提升。',
    wealth: '财运方面需要稳健理财，避免冲动消费，适当投资可带来回报。',
    relationship: '感情方面宜真诚相待，注重沟通和理解，感情运势稳定。',
    health: '注意劳逸结合，保持良好作息，适当运动有助于身心健康。',
  };
}
