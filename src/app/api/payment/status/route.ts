import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const orderId = req.nextUrl.searchParams.get('orderId');
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!orderId && !sessionId) {
    return NextResponse.json({ error: '缺少订单ID' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  // orderId 模式（payment/create 流程）：订单在 checkout 前已建，查不到即真的不存在
  if (orderId) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      // 只取响应用得到的两列：success 页会轮询本接口，别每次拉整行
      select: { status: true, paidAt: true },
    });

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    return NextResponse.json({ status: order.status, paidAt: order.paidAt });
  }

  // sessionId 模式（stripe/create-checkout 直购流程）：该流程无内部 orderId，
  // success 页只拿得到 Stripe 的 session_id；webhook 落库时订单 transactionId
  // = session.id（outTradeNo = `WH-${session.id}`），据此反查。查不到不返回 404 ——
  // 大概率是 webhook 尚未到达，返回 pending 供前端继续轮询。
  const order = await prisma.order.findFirst({
    where: {
      userId: user.id,
      OR: [{ transactionId: sessionId! }, { outTradeNo: `WH-${sessionId}` }],
    },
    select: { status: true, paidAt: true },
  });

  if (!order) {
    return NextResponse.json({ status: 'pending', paidAt: null });
  }

  return NextResponse.json({ status: order.status, paidAt: order.paidAt });
}
