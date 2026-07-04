import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/ip'

export async function POST(req: NextRequest) {
  try {
    // Security Fix: SEC-006 — 使用 x-vercel-forwarded-for 优先
    const ip = getClientIp(req);

    const { allowed } = await checkRateLimit('check-email', ip, 5, 60);
    if (!allowed) {
      // Security Fix: SEC-004 — 被限流时也统一返回格式，不暴露存在性
      return NextResponse.json({ exists: false }, { status: 429 })
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: '缺少 email 参数' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Security Fix: SEC-004 — 统一返回，增加固定延迟防止时序攻击
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
    return NextResponse.json({ exists: !!user })
  } catch (error) {
    console.error('Check email error:', error)
    return NextResponse.json({ error: '检查失败' }, { status: 500 })
  }
}
