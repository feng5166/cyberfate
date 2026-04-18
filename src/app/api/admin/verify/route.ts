import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const normalizedEmail = session.user.email.toLowerCase().trim();
  const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(normalizedEmail);

  return NextResponse.json({ isAdmin });
}
