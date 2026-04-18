import { NextResponse } from 'next/server'
import { isGoogleAuthEnabled } from '@/lib/auth'

export async function GET() {
  return NextResponse.json({ enabled: isGoogleAuthEnabled })
}
