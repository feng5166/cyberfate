import { NextRequest } from 'next/server'
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

    const normalizedEmail = email.toLowerCase().trim()

    if (isRateLimited(normalizedEmail)) {
      return Response.json(
        { success: false, error: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return Response.json(
        { success: false, error: 'EMAIL_NOT_FOUND' },
        { status: 400 }
      )
    }

    const token = await createAndSaveResetToken(normalizedEmail)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

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
