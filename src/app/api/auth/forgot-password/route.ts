import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import {
  isRateLimited,
  createAndSaveResetToken,
  sendResetEmail,
} from '@/lib/password-reset'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body as { email?: string }

    if (!email || !EMAIL_REGEX.test(email)) {
      return Response.json(
        { success: false, error: 'INVALID_EMAIL' },
        { status: 400 }
      )
    }

    // [安全修复] 统一小写 + trim，防止大小写绕过
    const normalizedEmail = email.toLowerCase().trim()

    if (await isRateLimited(normalizedEmail)) {
      return Response.json(
        { success: false, error: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // [安全修复] 不暴露用户是否存在 — 统一返回成功（防止邮箱枚举）
    // 但仍生成 token 以保持一致的时间响应
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      // 静默成功：不透露该邮箱是否已注册
      // 等价耗时，防止时序枚举
      await bcrypt.hash('dummy', 10)
      console.log(`[Security] forgot-password attempt for unregistered email: ${normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2')}`)
      return Response.json({ success: true })
    }

    // 过滤内部合成邮箱（微信用户不支持邮件重置）
    if (normalizedEmail.endsWith('@cyberfate.internal')) {
      console.log(`[Security] forgot-password attempt for synthetic email: ${normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2')}`)
      return Response.json({ success: true }) // 同样静默
    }

    const token = await createAndSaveResetToken(normalizedEmail)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`

    await sendResetEmail(normalizedEmail, resetUrl)

    return Response.json({ success: true })
  } catch (error) {
    console.error('forgot-password error:', error)
    return Response.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
