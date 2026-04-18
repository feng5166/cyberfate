import { NextRequest, NextResponse } from 'next/server';
import { calculateZiwei } from '@/lib/ziwei';
import type { ZiweiInput } from '@/lib/ziwei';

const SHICHEN_MAP: Record<string, number> = {
  '子时': 0, '丑时': 1, '寅时': 2, '卯时': 3,
  '辰时': 4, '巳时': 5, '午时': 6, '未时': 7,
  '申时': 8, '酉时': 9, '戌时': 10, '亥时': 11,
};

const SHICHEN_NAMES = ['子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时'];

function parseBirthHour(body: Record<string, unknown>): number {
  if (typeof body.hour === 'number') {
    const h = body.hour as number;
    if (h >= 0 && h <= 11) return h;
    throw new Error(`hour 应为 0-11，收到: ${h}`);
  }

  if (typeof body.birthTime === 'string') {
    const key = body.birthTime as string;
    const normalized = key.endsWith('时') ? key : `${key}时`;
    const val = SHICHEN_MAP[normalized];
    if (val !== undefined) return val;
    throw new Error(`无法识别的时辰: ${body.birthTime}，请使用 子时/丑时/.../亥时`);
  }

  if (typeof body.birthHour === 'string') {
    const val = SHICHEN_MAP[body.birthHour as string];
    if (val !== undefined) return val;
  }
  if (typeof body.birthHour === 'number') {
    const h = body.birthHour as number;
    if (h >= 0 && h <= 11) return h;
  }

  throw new Error('缺少出生时辰参数，请提供 hour (0-11) 或 birthTime (子时~亥时)');
}

function parseGender(body: Record<string, unknown>): 'male' | 'female' {
  const g = body.gender;
  if (g === 'male' || g === '男') return 'male';
  if (g === 'female' || g === '女') return 'female';
  throw new Error(`无效的性别参数: ${g}，请使用 '男'/'女' 或 'male'/'female'`);
}

export async function POST(req: NextRequest) {
  // Security Fix: SEC-012 — 添加登录检查
  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const birthDate = body.birthDate as string;
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return NextResponse.json(
        { error: '无效的出生日期，格式应为 YYYY-MM-DD' },
        { status: 400 },
      );
    }

    const birthHour = parseBirthHour(body);
    const gender = parseGender(body);
    const longitude = typeof body.longitude === 'number' ? body.longitude as number : undefined;
    const name = (body.name as string) || undefined;

    const input: ZiweiInput = {
      birthDate,
      birthHour,
      gender,
      birthPlace: longitude !== undefined ? { longitude, latitude: 0 } : undefined,
    };

    const result = calculateZiwei(input);

    const response: Record<string, unknown> = {
      palaces: result.palaces,
      wuxingju: result.wuxingJu,
      mingzhu: result.mingzhu,
      shenzhu: result.shenzhu,
      mingGong: result.mingGong,
      shenGong: result.shenGong,
      lunar: {
        year: result.debug.yearGanZhi,
        month: result.debug.lunarMonth,
        day: result.debug.lunarDay,
        lunarDate: result.debug.lunarDate,
        isLeapMonth: result.debug.isLeapMonth,
      },
      name: name || '缘主',
      birthHourName: SHICHEN_NAMES[birthHour],
    };

    if (process.env.NODE_ENV !== 'production') {
      response.debug = {
        sizhu: [
          result.debug.yearGanZhi,
          result.debug.monthGanZhi,
          result.debug.dayGanZhi,
          result.debug.hourGanZhi,
        ],
        trueSolarOffset: result.debug.trueSolarOffset,
        algorithm: '三合派',
        mingGongBranch: result.debug.mingGongBranch,
        shenGongBranch: result.debug.shenGongBranch,
        wuxingJuNumber: result.debug.wuxingJuNumber,
        ziweiStarBranch: result.debug.ziweiStarBranch,
      };
    }

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '排盘计算失败';
    console.error('[Ziwei API Error]', err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
