import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateBazi } from '@/lib/bazi';
import { generateBaziAnalysis } from '@/lib/ai';
import type { BaziResponse, ShiChen } from '@/lib/bazi/types';

// 时辰选项
const VALID_SHICHEN: ShiChen[] = [
  '不知道', '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时',
];

// 请求体验证
const requestSchema = z.object({
  name: z.string().optional(),
  gender: z.enum(['male', 'female']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  birthHour: z.string().optional().refine(
    (val) => !val || VALID_SHICHEN.includes(val as ShiChen),
    '无效的时辰'
  ),
});

export async function POST(req: NextRequest): Promise<NextResponse<BaziResponse>> {
  try {
    const body = await req.json();
    const input = requestSchema.parse(body);
    
    // 1. 计算八字
    const baziResult = calculateBazi({
      name: input.name,
      gender: input.gender,
      birthDate: input.birthDate,
      birthHour: input.birthHour as ShiChen | undefined,
    });
    
    // 2. AI 解读
    const analysis = await generateBaziAnalysis(baziResult, input.name);
    
    return NextResponse.json({
      success: true,
      data: {
        bazi: baziResult,
        analysis,
      },
    });
  } catch (error) {
    console.error('Bazi API error:', error);
    
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
