import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: '缺少 email 参数' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    return NextResponse.json({ exists: !!user })
  } catch (error) {
    console.error('Check email error:', error)
    return NextResponse.json({ error: '检查失败' }, { status: 500 })
  }
}
