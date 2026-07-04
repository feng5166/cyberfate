import type { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { encode } from 'next-auth/jwt'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/ip'

/**
 * 移动端邮箱密码登录。
 * 校验通过后用同一 NEXTAUTH_SECRET 签发长效 JWT，移动端存本地（MMKV），
 * 后续请求带 `Authorization: Bearer <token>`，由 lib/auth-session.ts 的 getAuthSession 解析。
 */
const secret = process.env.NEXTAUTH_SECRET
const MAX_AGE = 60 * 60 * 24 * 30 // 30 天

export async function POST(request: NextRequest) {
  // SEC-006：Vercel 环境优先用 x-vercel-forwarded-for 防伪造
  const ip = getClientIp(request)
  const rate = await checkRateLimit('mobile_login', ip, 10, 3600)
  if (!rate.allowed) {
    return Response.json({ error: '登录过于频繁，请稍后再试' }, { status: 429 })
  }

  if (!secret) {
    return Response.json({ error: '服务未配置认证密钥' }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    return Response.json({ error: '邮箱和密码不能为空' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      nickname: true,
      avatar: true,
      subscriptions: {
        where: { status: 'active', expireAt: { gt: new Date() } },
        select: { id: true },
        take: 1,
      },
    },
  })

  // 统一错误文案，避免暴露邮箱是否注册（防用户枚举）
  if (!user || !user.passwordHash) {
    return Response.json({ error: '邮箱或密码错误' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return Response.json({ error: '邮箱或密码错误' }, { status: 401 })
  }

  const isSubscribed = (user.subscriptions?.length ?? 0) > 0

  // 与 NextAuth jwt 回调相同的 payload 结构，保证 getAuthSession decode 后可用
  const token = await encode({
    token: {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      isSubscribed,
    },
    secret,
    maxAge: MAX_AGE,
  })

  return Response.json({
    token,
    expiresIn: MAX_AGE,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      isSubscribed,
    },
  })
}
