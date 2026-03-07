import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password, nickname } = body

  if (!email || !password) {
    return Response.json({ error: '邮箱和密码不能为空' }, { status: 400 })
  }

  if (password.length < 6) {
    return Response.json({ error: '密码至少6位' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return Response.json({ error: '该邮箱已注册' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      nickname: nickname || email.split('@')[0],
    },
  })

  return Response.json({ id: user.id, email: user.email }, { status: 201 })
}
