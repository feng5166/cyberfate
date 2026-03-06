import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateBazi, getDayGanzhi, getLunarDate } from '@/lib/bazi';
import { generateDailyFortune } from '@/lib/ai';
import type { DailyResponse, ShiChen } from '@/lib/bazi/types';

// 时辰选项
const VALID_SHICHEN: ShiChen[] = [
  '不知道', '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时',
];

// 请求体验证
const requestSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  birthHour: z.string().optional().refine(
    (val) => !val || VALID_SHICHEN.includes(val as ShiChen),
    '无效的时辰'
  ),
  gender: z.enum(['male', 'female']),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '目标日期格式应为 YYYY-MM-DD').optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse<DailyResponse>> {
  try {
    const body = await req.json();
    const input = requestSchema.parse(body);
    
    // 目标日期默认为今天
    const targetDate = input.targetDate || new Date().toISOString().split('T')[0];
    
    // 1. 计算用户八字，获取日主
    const baziResult = calculateBazi({
      gender: input.gender,
      birthDate: input.birthDate,
      birthHour: input.birthHour as ShiChen | undefined,
    });
    
    // 2. 获取目标日期的干支
    const dayGanzhi = getDayGanzhi(targetDate);
    const lunarDate = getLunarDate(targetDate);
    
    // 3. AI 生成运势
    const fortune = await generateDailyFortune(
      baziResult.dayMaster,
      targetDate,
      dayGanzhi
    );
    
    return NextResponse.json({
      success: true,
      data: {
        date: targetDate,
        lunarDate,
        dayGanzhi,
        overall: fortune.overall,
        ratings: fortune.ratings,
        suitable: fortune.suitable,
        avoid: fortune.avoid,
        lucky: fortune.lucky,
        advice: fortune.advice,
      },
    });
  } catch (error) {
    console.error('Daily API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '输入数据格式错误：' + error.issues.map(e => e.message).join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
