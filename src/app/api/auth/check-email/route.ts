import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Security Fix: SEC-004 — 速率限制防止用户枚举
const checkAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 分钟
const RATE_LIMIT_MAX = 5;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = checkAttempts.get(identifier);

  if (!record || now > record.resetAt) {
    checkAttempts.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Security Fix: SEC-006 — 使用 x-vercel-forwarded-for 优先
    const ip = req.headers.get('x-vercel-forwarded-for')?.split(',')[0]
      || req.headers.get('x-forwarded-for')?.split(',')[0]
      || 'unknown';

    if (!checkRateLimit(ip)) {
      // Security Fix: SEC-004 — 被限流时也统一返回格式，不暴露存在性
      return NextResponse.json({ exists: false }, { status: 429 })
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: '缺少 email 参数' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Security Fix: SEC-004 — 统一返回，增加固定延迟防止时序攻击
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
    return NextResponse.json({ exists: !!user })
  } catch (error) {
    console.error('Check email error:', error)
    return NextResponse.json({ error: '检查失败' }, { status: 500 })
  }
}
