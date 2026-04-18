import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Security Fix: SEC-006 — Vercel 环境优先使用 x-vercel-forwarded-for 防止伪造
  const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]
    || request.headers.get('x-forwarded-for')?.split(',')[0]
    || 'unknown';
  const rateResult = await checkRateLimit('register', ip, 5, 3600);
  if (!rateResult.allowed) {
    return Response.json(
      { error: '注册频率限制，请稍后重试' },
      { status: 429 }
    );
  }

  // ── 输入校验 ──
  const body = await request.json()
  const { email, password, nickname } = body

  if (!email || !password) {
    return Response.json({ error: '邮箱和密码不能为空' }, { status: 400 })
  }

  if (password.length < 6) {
    return Response.json({ error: '密码至少6位' }, { status: 400 })
  }

  // Email 格式校验
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return Response.json({ error: '邮箱格式不正确' }, { status: 400 })
  }

  // nickname 长度限制
  const safeNickname = (nickname || email.split('@')[0]).trim().slice(0, 30);
  if (!safeNickname || safeNickname.length < 1) {
    return Response.json({ error: '昵称不能为空' }, { status: 400 })
  }

  // nickname 禁止特殊字符
  if (/[<>\"'\\]/.test(safeNickname)) {
    return Response.json({ error: '昵称包含非法字符' }, { status: 400 })
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
      nickname: safeNickname,
    },
  })

  return Response.json({ id: user.id, email: user.email }, { status: 201 })
}
