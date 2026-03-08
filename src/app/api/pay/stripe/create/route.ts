import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'

const PLAN_PRICES = {
  monthly: 2900,   // ¥29
  quarterly: 6900, // ¥69
  yearly: 19900,   // ¥199
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { plan } = await req.json()
    
    if (!plan || !PLAN_PRICES[plan as keyof typeof PLAN_PRICES]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    
    const amount = PLAN_PRICES[plan as keyof typeof PLAN_PRICES]
    
    // 创建订单记录
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        plan,
        amount,
        payMethod: 'stripe',
        status: 'pending',
        outTradeNo: `ORDER_${Date.now()}_${session.user.id}`,
      }
    })
    
    // 创建 Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cny',
            product_data: {
              name: `CyberFate VIP ${plan === 'monthly' ? '月卡' : plan === 'quarterly' ? '季卡' : '年卡'}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?order_id=${order.id}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      metadata: {
        orderId: order.id,
        userId: session.user.id,
        plan,
      },
    })
    
    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url 
    })
  } catch (error) {
    console.error('Stripe create error:', error)
    return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 })
  }
}
