import { prisma } from '@/lib/db';
import { redis } from '@/lib/cache/redis';

export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = { db: 'fail', redis: 'fail' };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = 'ok';
  } catch (e) {
    console.error('[Health] DB check failed:', e instanceof Error ? e.message : e);
  }

  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch (e) {
    console.error('[Health] Redis check failed:', e instanceof Error ? e.message : e);
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return Response.json(
    { status: allOk ? 'ok' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
