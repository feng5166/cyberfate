import crypto from 'crypto'
import { Resend } from 'resend'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import {
  getPasswordResetEmailHtml,
  getPasswordResetEmailText,
} from '@/lib/email-templates/password-reset'

const rateLimitMap = new Map<string, number>()

const RATE_LIMIT_WINDOW_MS = 60 * 1000
const TOKEN_EXPIRY_MINUTES = 15
const BCRYPT_SALT_ROUNDS = 10

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function isRateLimited(email: string): boolean {
  const lastRequest = rateLimitMap.get(email)
  if (!lastRequest) return false
  return Date.now() - lastRequest < RATE_LIMIT_WINDOW_MS
}

export async function createAndSaveResetToken(email: string): Promise<string> {
  const token = generateResetToken()
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: { email, token, expiresAt },
  })

  rateLimitMap.set(email, Date.now())

  return token
}

export async function validateResetToken(
  token: string
): Promise<{ email: string } | null> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  })

  if (!record) return null
  if (record.used) return null
  if (record.expiresAt < new Date()) return null

  return { email: record.email }
}

export async function markTokenUsed(token: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { token },
    data: { used: true },
  })
}

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: 'INVALID_TOKEN' | 'USER_NOT_FOUND' | 'UPDATE_FAILED'; detail?: string }

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  const result = await validateResetToken(token)
  if (!result) return { success: false, error: 'INVALID_TOKEN' }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)

  // [安全修复] 使用事务 + 先标记 token used 防止竞态重放
  try {
    await prisma.$transaction(async (tx) => {
      // 1. 先标记 token 为已使用（防止同一 token 并发重放）
      const tokenRecord = await tx.passwordResetToken.findUnique({ where: { token } })
      if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
        throw new Error('TOKEN_INVALID')
      }
      await tx.passwordResetToken.update({
        where: { token },
        data: { used: true },
      })

      // 2. 再更新密码
      await tx.user.update({
        where: { email: result.email },
        data: { passwordHash },
      })
    })
  } catch (err: unknown) {
    const prismaError = err as { code?: string; message?: string }
    console.error('resetPassword transaction failed:', {
      email: result.email,
      code: prismaError.code,
      message: prismaError.message,
    })

    if (prismaError?.message === 'TOKEN_INVALID' || prismaError.code === 'P2025') {
      return { success: false, error: 'USER_NOT_FOUND', detail: `email: ${result.email}` }
    }
    return { success: false, error: 'UPDATE_FAILED', detail: prismaError?.message || String(err) }
  }

  return { success: true }
}

export async function sendResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log('=== 密码重置邮件（开发模式，未配置 RESEND_API_KEY） ===')
    console.log(`收件人: ${email}`)
    console.log(`链接: ${resetUrl}`)
    console.log('=== 邮件结束 ===')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: 'CyberFate <noreply@cyberfate.me>',
    to: [email],
    subject: '重置您的 CyberFate 密码',
    html: getPasswordResetEmailHtml({ resetUrl }),
    text: getPasswordResetEmailText({ resetUrl }),
  })

  if (error) {
    console.error('发送密码重置邮件失败:', error)
    throw new Error('邮件发送失败')
  }
}
