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

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<boolean> {
  const result = await validateResetToken(token)
  if (!result) return false

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)

  await prisma.user.update({
    where: { email: result.email },
    data: { passwordHash },
  })

  await markTokenUsed(token)

  return true
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
