import { NextRequest, NextResponse } from 'next/server';

type ChaosMode = 'timeout' | '500' | 'empty' | 'slow';

function isChaosEnabled(): boolean {
  return process.env.NODE_ENV === 'development';
}

function getChaosMode(req: NextRequest): ChaosMode | null {
  if (!isChaosEnabled()) return null;
  const param = req.nextUrl.searchParams.get('_chaos');
  if (!param) return null;
  const valid: ChaosMode[] = ['timeout', '500', 'empty', 'slow'];
  return valid.includes(param as ChaosMode) ? (param as ChaosMode) : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function applyChaos(
  req: NextRequest,
): Promise<NextResponse | null> {
  const mode = getChaosMode(req);
  if (!mode) return null;

  console.warn(`[Chaos] mode=${mode} on ${req.nextUrl.pathname}`);

  switch (mode) {
    case 'timeout':
      // Simulate a hung request — never resolves in reasonable time
      await sleep(60_000);
      return NextResponse.json({ error: 'chaos_timeout' }, { status: 504 });

    case '500':
      return NextResponse.json(
        { error: 'chaos_internal_error', message: 'Simulated 500' },
        { status: 500 },
      );

    case 'empty':
      return new NextResponse(null, { status: 204 });

    case 'slow':
      await sleep(3_000);
      return null; // continue to real handler after delay
  }
}

/**
 * Wrap a route handler with chaos injection support.
 * Usage: export const GET = withChaos(handler);
 */
export function withChaos(
  handler: (req: NextRequest) => Promise<NextResponse>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const chaosResponse = await applyChaos(req);
    if (chaosResponse) return chaosResponse;
    return handler(req);
  };
}
