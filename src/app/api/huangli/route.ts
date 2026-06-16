import { NextRequest, NextResponse } from 'next/server';
import { calculateHuangli } from '@/lib/huangli/calculator';
import { getTodayBeijing } from '@/lib/timezone';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || getTodayBeijing();

  try {
    const [year] = date.split('-').map(Number);
    if (year < 1920 || year > 2100) {
      return NextResponse.json(
        { error: '支持的查询范围：1920-2100 年' },
        { status: 400 }
      );
    }

    const data = calculateHuangli(date);
    return NextResponse.json(data);
  } catch (err) {
    console.error('[Huangli API Error]', err);
    return NextResponse.json(
      { error: '数据加载失败，请稍后重试' },
      { status: 500 }
    );
  }
}
