import crypto from 'crypto'
import { Resend } from 'resend'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import {
  getPasswordResetEmailHtml,
  getPasswordResetEmailText,
} from '@/lib/email-templates/password-reset'
import { checkRateLimit } from '@/lib/rate-limit'

const TOKEN_EXPIRY_MINUTES = 15
const BCRYPT_SALT_ROUNDS = 10

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function isRateLimited(email: string): Promise<boolean> {
  const result = await checkRateLimit('pwd_reset', email, 3, 300)
  return !result.allowed
}

// Security Fix: SEC-005 — 存储 token 的 sha256 哈希而非明文
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function createAndSaveResetToken(email: string): Promise<string> {
  const token = generateResetToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: { email, token: tokenHash, expiresAt },
  })

  return token
}

// Security Fix: SEC-005 — 通过哈希查找 token
export async function validateResetToken(
  token: string
): Promise<{ email: string } | null> {
  const tokenHash = hashToken(token)
  const record = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash },
  })

  if (!record) return null
  if (record.used) return null
  if (record.expiresAt < new Date()) return null

  return { email: record.email }
}

export async function markTokenUsed(token: string): Promise<void> {
  const tokenHash = hashToken(token)
  await prisma.passwordResetToken.update({
    where: { token: tokenHash },
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

  // Security Fix: SEC-005 — 事务内使用 token 哈希查找
  const tokenHash = hashToken(token)
  try {
    await prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.passwordResetToken.findUnique({ where: { token: tokenHash } })
      if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
        throw new Error('TOKEN_INVALID')
      }
      await tx.passwordResetToken.update({
        where: { token: tokenHash },
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

// BUG-020: 清理过期 token，使用 deleteMany 避免 cursor 分页泄漏
export async function cleanExpiredTokens(): Promise<number> {
  const result = await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  return result.count
}

// Security Fix: SEC-020 — 校验重置 URL 域名
const ALLOWED_ORIGINS = ['https://www.cyberfate.me', 'https://cyberfate.me', 'http://localhost:3000']

export async function sendResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  const isAllowed = ALLOWED_ORIGINS.some(origin => resetUrl.startsWith(origin + '/'));
  if (!isAllowed) {
    console.error(`[Security] 拒绝发送密码重置邮件：非法 URL ${resetUrl}`);
    throw new Error('非法重置链接');
  }

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
