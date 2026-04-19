import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PRICING_CONFIG, type PlanId } from '@/lib/pricing-config'

function getPlanDisplayName(plan: string): string {
  const config = PRICING_CONFIG[plan as PlanId]
  return config ? `${config.name}（${config.period}卡）` : plan
}

const statusMap: Record<string, string> = {
  paid: 'paid',
  pending: 'pending',
  failed: 'failed',
  refunded: 'refunded',
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const pageParam = searchParams.get('page')
  const pageSizeParam = searchParams.get('pageSize')

  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : null
  const pageSize = Math.min(50, Math.max(1, parseInt(pageSizeParam || '20', 10) || 20))

  const where = { userId: session.user.id }

  // 不传 page 时返回全部（最多 50 条），保持向后兼容
  if (page === null) {
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const invoices = orders.map((order) => ({
      id: order.id,
      date: (order.paidAt ?? order.createdAt).toISOString().slice(0, 10),
      description: getPlanDisplayName(order.plan),
      amount: order.amount / 100,
      currency: 'CNY',
      status: statusMap[order.status] ?? order.status,
      invoice_url: null,
    }))

    return NextResponse.json({
      invoices,
      pagination: {
        page: 1,
        pageSize: invoices.length,
        total: invoices.length,
        totalPages: 1,
      }
    })
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ])

  const invoices = orders.map((order) => ({
    id: order.id,
    date: (order.paidAt ?? order.createdAt).toISOString().slice(0, 10),
    description: getPlanDisplayName(order.plan),
    amount: order.amount / 100,
    currency: 'CNY',
    status: statusMap[order.status] ?? order.status,
    invoice_url: null,
  }))

  return NextResponse.json({
    invoices,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    }
  })
}
