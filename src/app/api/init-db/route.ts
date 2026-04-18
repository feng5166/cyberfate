import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Security Fix: SEC-018 — init-db 需要管理员认证
const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

export async function GET() {
  // Security Fix: SEC-018 — 添加认证检查
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(session.user.email.toLowerCase().trim())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully',
      result 
    });
  } catch (error: unknown) {
    console.error('[init-db] Database error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed' 
    }, { status: 500 });
  }
}
