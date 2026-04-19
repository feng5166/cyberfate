import { prisma } from '@/lib/db';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'ready' }, { status: 200 });
  } catch {
    return Response.json(
      { status: 'not ready', reason: 'database unavailable' },
      { status: 503 }
    );
  }
}
