import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const planNameMap: Record<string, string> = {
  monthly: '基础版（月卡）',
  quarterly: '专业版（季卡）',
  yearly: '尊享版（年卡）',
}

const statusMap: Record<string, string> = {
  paid: 'paid',
  pending: 'pending',
  failed: 'failed',
  refunded: 'refunded',
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const invoices = orders.map((order) => ({
    id: order.id,
    date: (order.paidAt ?? order.createdAt).toISOString().slice(0, 10),
    description: planNameMap[order.plan] ?? order.plan,
    amount: order.amount / 100,
    currency: 'CNY',
    status: statusMap[order.status] ?? order.status,
    invoice_url: null,
  }))

  return NextResponse.json({ invoices })
}
