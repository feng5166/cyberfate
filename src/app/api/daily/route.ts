import { NextRequest } from 'next/server';
import { z } from 'zod';
import { calculateBazi, getDayGanzhi, getLunarDate } from '@/lib/bazi';
import { generateDailyFortune } from '@/lib/ai';

// 时辰映射：数字 -> 时辰名称
const HOUR_TO_SHICHEN: Record<number, string> = {
  [-1]: '不知道',
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
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  birthHour: z.number().int().min(-1).max(11),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '目标日期格式应为 YYYY-MM-DD').optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = requestSchema.parse(body);
    
    // 转换时辰
    const shichen = HOUR_TO_SHICHEN[input.birthHour] || '午时';
    
    // 目标日期默认为今天
    const targetDate = input.targetDate || new Date().toISOString().split('T')[0];
    
    // 1. 计算用户八字，获取日主
    const baziResult = calculateBazi({
      gender: 'male', // 每日运势不需要性别
      birthDate: input.birthDate,
      birthHour: shichen as '子时' | '丑时' | '寅时' | '卯时' | '辰时' | '巳时' | '午时' | '未时' | '申时' | '酉时' | '戌时' | '亥时' | '不知道',
    });
    
    // 2. 获取目标日期的干支
    const dayGanzhi = getDayGanzhi(targetDate);
    const lunarDate = getLunarDate(targetDate);
    
    // 3. 生成运势（可能失败，优雅降级）
    let fortune;
    try {
      fortune = await generateDailyFortune(
        baziResult.dayMaster,
        targetDate,
        dayGanzhi
      );
    } catch (aiError) {
      console.error('AI fortune failed:', aiError);
      fortune = generateFallbackFortune(baziResult.dayMaster, dayGanzhi, targetDate);
    }
    
    return Response.json({
      date: targetDate,
      lunarDate,
      dayGanzhi,
      overall: fortune.overall,
      ratings: fortune.ratings,
      suitable: fortune.suitable,
      avoid: fortune.avoid,
      lucky: fortune.lucky,
      advice: fortune.advice,
    });
  } catch (error) {
    console.error('Daily API error:', error);
    
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

// 基于字符串生成固定的伪随机数（0-1）
function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const str = seed + index;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash % 10000) / 10000;
}

// 降级运势生成（当 AI 不可用时）
function generateFallbackFortune(dayMaster: string, dayGanzhi: string, targetDate: string) {
  const seed = `${dayMaster}-${dayGanzhi}-${targetDate}`;
  
  const wuxingMap: Record<string, string> = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水',
  };
  
  const masterWuxing = dayMaster.slice(-1);
  const dayGan = dayGanzhi[0];
  const dayWuxing = wuxingMap[dayGan] || '土';
  
  const shengMap: Record<string, string> = {
    '金': '水', '水': '木', '木': '火', '火': '土', '土': '金',
  };
  const keMap: Record<string, string> = {
    '金': '木', '木': '土', '土': '水', '水': '火', '火': '金',
  };
  
  let overall = 3;
  let advice = '今日运势平稳，宜保持平常心。';
  
  if (shengMap[masterWuxing] === dayWuxing) {
    overall = 3;
    advice = '今日精力有所消耗，注意劳逸结合，适合做一些轻松的事情。';
  } else if (shengMap[dayWuxing] === masterWuxing) {
    overall = 4;
    advice = '今日贵人运佳，适合寻求帮助和合作，事半功倍。';
  } else if (keMap[masterWuxing] === dayWuxing) {
    overall = 4;
    advice = '今日财运不错，适合谈判、签约等财务相关事项。';
  } else if (keMap[dayWuxing] === masterWuxing) {
    overall = 2;
    advice = '今日压力较大，建议保持低调，避免与人争执。';
  } else {
    overall = 3;
    advice = '今日运势平稳，适合按部就班处理日常事务。';
  }
  
  const suitablePool = ['工作', '学习', '运动', '社交', '阅读', '创作', '购物', '旅行', '投资', '谈判'];
  const avoidPool = ['争吵', '冒险', '熬夜', '饮酒', '赌博', '冲动消费', '重大决策', '签约'];
  
  // 使用固定种子选择
  const suitableCount = 2 + overall;
  const suitable = suitablePool
    .slice(0, suitableCount)
    .sort((a, b) => seededRandom(seed + 'suitable', suitablePool.indexOf(a)) - seededRandom(seed + 'suitable', suitablePool.indexOf(b)))
    .slice(0, 3);
  
  const avoid = avoidPool
    .slice(overall - 1)
    .sort((a, b) => seededRandom(seed + 'avoid', avoidPool.indexOf(a)) - seededRandom(seed + 'avoid', avoidPool.indexOf(b)))
    .slice(0, 2);
  
  const colors = ['红色', '黄色', '蓝色', '绿色', '紫色', '白色', '金色'];
  const directions = ['东方', '南方', '西方', '北方', '东南', '东北', '西南', '西北'];
  
  return {
    overall,
    ratings: {
      career: Math.min(5, Math.max(1, overall + Math.floor(seededRandom(seed, 1) * 2) - 1)),
      wealth: Math.min(5, Math.max(1, overall + Math.floor(seededRandom(seed, 2) * 2) - 1)),
      love: Math.min(5, Math.max(1, overall + Math.floor(seededRandom(seed, 3) * 2) - 1)),
      health: Math.min(5, Math.max(1, overall + Math.floor(seededRandom(seed, 4) * 2))),
    },
    suitable,
    avoid,
    lucky: {
      color: colors[Math.floor(seededRandom(seed, 5) * colors.length)],
      numbers: [
        Math.floor(seededRandom(seed, 6) * 9) + 1,
        Math.floor(seededRandom(seed, 7) * 9) + 1
      ],
      direction: directions[Math.floor(seededRandom(seed, 8) * directions.length)],
    },
    advice,
  };
}
