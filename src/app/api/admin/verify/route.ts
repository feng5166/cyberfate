import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

let ADMIN_EMAILS: string[] = [];
try {
  const raw = process.env.ADMIN_EMAILS || '';
  ADMIN_EMAILS = raw.split(',').filter(Boolean);
} catch (e) {
  console.warn('[admin/verify] Failed to parse ADMIN_EMAILS env var, defaulting to empty list:', e);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const normalizedEmail = session.user.email.toLowerCase().trim();
  const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(normalizedEmail);

  return NextResponse.json({ isAdmin });
}
