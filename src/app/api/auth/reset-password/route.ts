import { NextRequest } from 'next/server'
import { validateResetToken, resetPassword } from '@/lib/password-reset'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password, confirmPassword } = body as {
      token?: string
      password?: string
      confirmPassword?: string
    }

    if (!token || !password || !confirmPassword) {
      return Response.json(
        { success: false, error: 'MISSING_FIELDS' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return Response.json(
        { success: false, error: 'PASSWORD_MISMATCH' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return Response.json(
        { success: false, error: 'PASSWORD_TOO_WEAK' },
        { status: 400 }
      )
    }

    const result = await validateResetToken(token)
    if (!result) {
      return Response.json(
        { success: false, error: 'INVALID_TOKEN' },
        { status: 400 }
      )
    }

    const success = await resetPassword(token, password)
    if (!success) {
      return Response.json(
        { success: false, error: 'RESET_FAILED' },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('reset-password error:', error)
    return Response.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
