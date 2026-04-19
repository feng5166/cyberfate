import { NextRequest } from 'next/server'
import { validateResetToken, resetPassword } from '@/lib/password-reset'
import { checkRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const SERVICE = 'api/auth/reset-password'

const ERROR_MESSAGES: Record<string, string> = {
  MISSING_FIELDS: '缺少必要参数',
  PASSWORD_MISMATCH: '两次输入的密码不一致',
  PASSWORD_TOO_WEAK: '密码长度不足（至少8个字符）',
  INVALID_TOKEN: '重置链接无效或已过期，请重新申请',
  USER_NOT_FOUND: '未找到对应的用户账号，请联系客服',
  UPDATE_FAILED: '密码更新失败，请稍后重试',
  INTERNAL_ERROR: '服务器内部错误，请稍后重试',
}

// ── GET: 只读验证 token（不消耗）─────────────────────────────────
// 支持 query param (?token=xxx) 和 hash fragment (#token=xxx) 两种方式
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed } = await checkRateLimit('reset_token_check', ip, 10, 60)
    if (!allowed) {
      return Response.json(
        { valid: false, error: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    // 优先从 query 获取，如果没有则返回提示前端从 hash 读取
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return Response.json(
        { valid: false, error: 'MISSING_TOKEN', message: '缺少重置令牌', hint: 'hash' },
        { status: 400 }
      )
    }

    const result = await validateResetToken(token)

    if (!result) {
      return Response.json(
        { valid: false, error: 'INVALID_TOKEN', message: '重置链接无效或已过期，请重新申请' },
        { status: 410 }
      )
    }

    return Response.json({
      valid: true,
      email: result.email,
      message: '重置链接有效',
    })
  } catch (error) {
    logger.error(SERVICE, 'validate-token error', error instanceof Error ? error : undefined)
    return Response.json(
      { valid: false, error: 'INTERNAL_ERROR', message: '服务器异常，请稍后重试' },
      { status: 500 }
    )
  }
}

// ── POST: 执行密码重置（消耗 token）──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed } = await checkRateLimit('reset_password', ip, 5, 300)
    if (!allowed) {
      return Response.json(
        { success: false, error: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { token, password, confirmPassword } = body as {
      token?: string
      password?: string
      confirmPassword?: string
    }

    if (!token || !password || !confirmPassword) {
      return Response.json(
        { success: false, error: 'MISSING_FIELDS', message: ERROR_MESSAGES.MISSING_FIELDS },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return Response.json(
        { success: false, error: 'PASSWORD_MISMATCH', message: ERROR_MESSAGES.PASSWORD_MISMATCH },
        { status: 400 }
      )
    }

    // 密码策略：8位以上 + 至少1数字1字母。有意选择：兼顾安全性与用户体验，
    // 不要求特殊字符以降低重置摩擦，字母+数字组合可防范纯数字/纯字母弱密码。
    if (password.length < 8) {
      return Response.json(
        { success: false, error: 'PASSWORD_TOO_WEAK', message: ERROR_MESSAGES.PASSWORD_TOO_WEAK },
        { status: 400 }
      )
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    if (!hasLetter || !hasDigit) {
      return Response.json(
        { success: false, error: 'PASSWORD_TOO_WEAK', message: '密码需包含字母和数字' },
        { status: 400 }
      )
    }

    const result = await resetPassword(token, password)
    if (!result.success) {
      const message = ERROR_MESSAGES[result.error] || ERROR_MESSAGES.INTERNAL_ERROR
      const status = result.error === 'USER_NOT_FOUND' ? 400 : 500
      logger.error(SERVICE, 'resetPassword failed', undefined, { error: result.error, detail: result.detail })
      return Response.json(
        { success: false, error: result.error, message },
        { status }
      )
    }

    return Response.json({ success: true, message: '密码重置成功' })
  } catch (error: unknown) {
    const prismaError = error as { code?: string; message?: string };
    logger.error(SERVICE, 'reset-password unhandled error', error instanceof Error ? error : undefined, {
      code: prismaError.code,
    })

    if (prismaError.code?.startsWith('P')) {
      return Response.json(
        { success: false, error: 'DATABASE_ERROR', message: '数据库操作失败，请稍后重试' },
        { status: 500 }
      )
    }

    return Response.json(
      { success: false, error: 'INTERNAL_ERROR', message: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: 500 }
    )
  }
}
