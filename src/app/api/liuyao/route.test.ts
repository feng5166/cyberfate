import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks (hoisted) ---
const getServerSession = vi.fn();
vi.mock('next-auth', () => ({ getServerSession }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

vi.mock('@/lib/chaos-middleware', () => ({ applyChaos: vi.fn(async () => null) }));

const checkRateLimit = vi.fn();
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: (...a: unknown[]) => checkRateLimit(...a) }));

const checkLiuyaoQuota = vi.fn();
const refundQuota = vi.fn();
vi.mock('@/lib/quota', () => ({
  checkLiuyaoQuota: (...a: unknown[]) => checkLiuyaoQuota(...a),
  refundQuota: (...a: unknown[]) => refundQuota(...a),
}));

const getCache = vi.fn();
const setCache = vi.fn();
vi.mock('@/lib/ai/cache', () => ({
  generateCacheKey: (prefix: string, params: Record<string, unknown>) =>
    `${prefix}:${JSON.stringify(params)}`,
  getCache: (...a: unknown[]) => getCache(...a),
  setCache: (...a: unknown[]) => setCache(...a),
}));

const generateLiuYaoReading = vi.fn();
vi.mock('@/lib/ai/client', () => ({
  generateLiuYaoReading: (...a: unknown[]) => generateLiuYaoReading(...a),
}));

vi.mock('@/lib/ai/circuitBreaker', () => ({
  // Run the wrapped fn directly (no real breaker state).
  withCircuitBreaker: (_key: string, fn: () => unknown) => fn(),
}));

vi.mock('@/lib/logger', () => ({ log: vi.fn() }));

// NOTE: @/lib/liuyao/data is kept real so meta is lib-computed.

import { POST } from './route';

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://test/api/liuyao', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...headers },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

const validBody = {
  question: '事业如何',
  hexagrams: { upper: '乾', lower: '乾', lines: [1, 1, 1, 1, 1, 1], movingLines: [0] },
  method: 'coin',
  divinationTime: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network blocked'); }));
  getServerSession.mockResolvedValue({ user: { id: 'u1' } });
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
  checkLiuyaoQuota.mockResolvedValue({ hasQuota: true, isVip: false, limit: 3 });
  getCache.mockResolvedValue(null);
  setCache.mockResolvedValue(undefined);
  refundQuota.mockResolvedValue(undefined);
  generateLiuYaoReading.mockResolvedValue({
    lineInterpretations: ['a', 'b', 'c', 'd', 'e', 'f'],
    overallNarrative: '整体叙事文本。',
    summary: '小结',
    positives: ['好'],
    cautions: ['注意'],
    actions: ['行动'],
    _source: 'deepseek',
  });
});

describe('POST /api/liuyao', () => {
  it('returns 401 when unauthenticated and no debug token', async () => {
    getServerSession.mockResolvedValue(null);
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: '请先登录' });
  });

  it('returns 400 when lines are not exactly 6', async () => {
    const res = await POST(makeReq({ ...validBody, hexagrams: { ...validBody.hexagrams, lines: [1, 1, 1] } }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: '需要6根爻的数据' });
  });

  it('returns 400 when a line value is not 0 or 1', async () => {
    const res = await POST(makeReq({ ...validBody, hexagrams: { ...validBody.hexagrams, lines: [1, 1, 1, 1, 1, 2] } }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: '爻数据只能为0(阴)或1(阳)' });
  });

  it('returns 400 for an invalid method', async () => {
    const res = await POST(makeReq({ ...validBody, method: 'telepathy' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: '无效的起卦方式' });
  });

  it('returns 403 when quota is exhausted', async () => {
    checkLiuyaoQuota.mockResolvedValue({ hasQuota: false, isVip: false, limit: 3 });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('QUOTA_EXCEEDED');
  });

  it('returns 429 when rate limited', async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(429);
  });

  it('valid payload streams 200 SSE (AI mocked, fallback-safe)', async () => {
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/event-stream');
    expect(generateLiuYaoReading).toHaveBeenCalled();
  });

  it('falls back to direct generate when circuit breaker throws, still 200', async () => {
    // First call (inside breaker) throws, second (fallback) returns a fallback reading.
    generateLiuYaoReading
      .mockRejectedValueOnce(new Error('upstream down'))
      .mockResolvedValueOnce({
        lineInterpretations: ['', '', '', '', '', ''],
        overallNarrative: '兜底叙事。',
        summary: '', positives: [], cautions: [], actions: [],
        _source: 'fallback',
      });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/event-stream');
    // fallback path should refund the consumed (non-VIP) quota
    expect(refundQuota).toHaveBeenCalledWith('u1', 'liuyaoCount');
  });
});
