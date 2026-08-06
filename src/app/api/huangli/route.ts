import { NextRequest, NextResponse } from 'next/server';
import { calculateHuangli, getMonthLunarDays } from '@/lib/huangli/calculator';
import { getTodayBeijing, getSecondsUntilBeijingMidnight } from '@/lib/timezone';

// 黄历为确定性纯计算：同一 date/month 的结果永不变化，可放心让 CDN 长缓存。
const IMMUTABLE_CACHE = 'public, s-maxage=31536000, immutable';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  try {
    // ?month=YYYY-MM：一次返回整月农历信息（供客户端日历组件，免拖 lunar-javascript 进首屏）
    const monthParam = searchParams.get('month');
    if (monthParam) {
      const m = /^(\d{4})-(\d{2})$/.exec(monthParam);
      const year = m ? Number(m[1]) : NaN;
      const month = m ? Number(m[2]) : NaN;
      if (!m || year < 1920 || year > 2100 || month < 1 || month > 12) {
        return NextResponse.json(
          { error: 'month 格式应为 YYYY-MM，范围 1920-01 至 2100-12' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { year, month, days: getMonthLunarDays(year, month) },
        { headers: { 'Cache-Control': IMMUTABLE_CACHE } }
      );
    }

    const dateParam = searchParams.get('date');
    const date = dateParam || getTodayBeijing();

    // 宽松到 \d{1,2}：旧接口对非补零日期（2026-8-6）也能算，保持兼容
    const [year] = date.split('-').map(Number);
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(date) || year < 1920 || year > 2100) {
      return NextResponse.json(
        { error: '支持的查询范围：1920-2100 年' },
        { status: 400 }
      );
    }

    // 响应体带上实际解析的日期：无参数分支按北京时间取「今天」，客户端可据此对齐
    const data = { ...calculateHuangli(date), date };

    // 显式 date → 结果永不变，CDN 永久缓存；「今天」→ 只缓存到北京次日零点，跨天自动失效
    const cacheControl = dateParam
      ? IMMUTABLE_CACHE
      : `public, s-maxage=${getSecondsUntilBeijingMidnight()}`;

    return NextResponse.json(data, { headers: { 'Cache-Control': cacheControl } });
  } catch (err) {
    console.error('[Huangli API Error]', err);
    return NextResponse.json(
      { error: '数据加载失败，请稍后重试' },
      { status: 500 }
    );
  }
}
