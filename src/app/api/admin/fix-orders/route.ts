import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PRICING_CONFIG, isValidPlanId } from '@/lib/pricing-config';

const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(session.user.email.toLowerCase().trim())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  void req;
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const zeroAmountOrders = await prisma.order.findMany({
      where: { amount: 0, status: 'paid' },
    });

    if (zeroAmountOrders.length === 0) {
      return NextResponse.json({ success: true, updated: 0, details: [] });
    }

    const results: { id: string; plan: string; oldAmount: number; newAmount: number; skipped?: boolean }[] = [];

    for (const order of zeroAmountOrders) {
      if (!isValidPlanId(order.plan)) {
        results.push({ id: order.id, plan: order.plan, oldAmount: order.amount, newAmount: 0, skipped: true });
        continue;
      }
      const correctAmount = PRICING_CONFIG[order.plan].amount;
      await prisma.order.update({
        where: { id: order.id },
        data: { amount: correctAmount },
      });
      results.push({ id: order.id, plan: order.plan, oldAmount: order.amount, newAmount: correctAmount });
    }

    const updated = results.filter(r => !r.skipped).length;

    return NextResponse.json({ success: true, updated, details: results });

  } catch (error: unknown) {
    console.error('Fix orders error:', error);
    return NextResponse.json({ error: '修正失败，请稍后重试' }, { status: 500 });
  }
}
