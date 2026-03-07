import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: '缺少 email 参数' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  return NextResponse.json({ exists: !!user })
}
