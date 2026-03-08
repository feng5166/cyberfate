import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const { orderId, userId, plan } = session.metadata || {}
      
      if (!orderId || !userId || !plan) {
        throw new Error('Missing metadata')
      }
      
      // 更新订单状态
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'paid',
          transactionId: session.payment_intent as string,
          paidAt: new Date(),
        }
      })
      
      // 计算有效期
      const now = new Date()
      const expireAt = new Date(now)
      if (plan === 'monthly') {
        expireAt.setMonth(expireAt.getMonth() + 1)
      } else if (plan === 'quarterly') {
        expireAt.setMonth(expireAt.getMonth() + 3)
      } else if (plan === 'yearly') {
        expireAt.setFullYear(expireAt.getFullYear() + 1)
      }
      
      // 创建或更新订阅
      const existingSub = await prisma.subscription.findFirst({
        where: { userId }
      })
      
      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            plan: plan as 'monthly' | 'quarterly' | 'yearly',
            status: 'active',
            expireAt,
          }
        })
      } else {
        await prisma.subscription.create({
          data: {
            userId,
            plan: plan as 'monthly' | 'quarterly' | 'yearly',
            status: 'active',
            startAt: now,
            expireAt,
          }
        })
      }
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 })
  }
}
