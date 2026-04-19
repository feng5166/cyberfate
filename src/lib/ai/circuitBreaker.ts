import { getRedis } from '@/lib/cache/redis';

export class CircuitOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker "${name}" is OPEN — service unavailable`);
    this.name = 'CircuitOpenError';
  }
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitData {
  state: CircuitState;
  failures: number;
  openedAt: number | null;
}

const FAILURE_THRESHOLD = 5;
const RECOVERY_WINDOW_MS = 30_000;

function key(name: string) {
  return `circuit:${name}`;
}

async function getState(name: string): Promise<CircuitData> {
  const redis = getRedis();
  if (!redis) return { state: 'CLOSED', failures: 0, openedAt: null };

  const raw = await redis.get<CircuitData>(key(name));
  return raw ?? { state: 'CLOSED', failures: 0, openedAt: null };
}

async function setState(name: string, data: CircuitData): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(key(name), data, { ex: 300 });
}

export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const data = await getState(name);

  if (data.state === 'OPEN') {
    const elapsed = Date.now() - (data.openedAt ?? 0);
    if (elapsed < RECOVERY_WINDOW_MS) {
      throw new CircuitOpenError(name);
    }
    // transition to HALF_OPEN
    await setState(name, { ...data, state: 'HALF_OPEN' });
  }

  try {
    const result = await fn();
    // success — reset circuit
    await setState(name, { state: 'CLOSED', failures: 0, openedAt: null });
    return result;
  } catch (err) {
    const failures = (data.failures ?? 0) + 1;
    if (failures >= FAILURE_THRESHOLD || data.state === 'HALF_OPEN') {
      await setState(name, { state: 'OPEN', failures, openedAt: Date.now() });
    } else {
      await setState(name, { ...data, state: 'CLOSED', failures });
    }
    throw err;
  }
}
