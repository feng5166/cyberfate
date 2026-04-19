import { prisma } from '@/lib/db';
import { getRedis } from '@/lib/cache/redis';

const VERSION = process.env.npm_package_version ?? '1.0.0';

export async function GET() {
  const checks: Record<string, 'ok' | 'degraded' | 'missing'> = {
    database: 'missing',
    redis: 'missing',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (e) {
    checks.database = 'degraded';
    console.error('[Health] DB check failed:', e instanceof Error ? e.message : e);
  }

  const redisClient = getRedis();
  if (!redisClient) {
    checks.redis = 'missing';
  } else {
    try {
      await redisClient.ping();
      checks.redis = 'ok';
    } catch (e) {
      checks.redis = 'degraded';
      console.error('[Health] Redis check failed:', e instanceof Error ? e.message : e);
    }
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return Response.json(
    {
      status: allOk ? 'ok' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks,
      version: VERSION,
    },
    { status: allOk ? 200 : 503 }
  );
}
