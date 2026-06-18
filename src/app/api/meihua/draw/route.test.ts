import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks (hoisted) ---
const getServerSession = vi.fn();
vi.mock('next-auth', () => ({ getServerSession }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

const getCache = vi.fn();
const setCache = vi.fn();
vi.mock('@/lib/ai/cache', () => ({
  generateCacheKey: (prefix: string, params: Record<string, unknown>) =>
    `${prefix}:${JSON.stringify(params)}`,
  getCache: (...args: unknown[]) => getCache(...args),
  setCache: (...args: unknown[]) => setCache(...args),
}));

// 配额：默认放行（统一配额策略 v1：梅花起卦 1 次/天）
const checkMeihuaDrawQuota = vi.fn(async () => ({ hasQuota: true, limit: 1, isVip: false }));
vi.mock('@/lib/quota', () => ({
  checkMeihuaDrawQuota: (...args: unknown[]) => checkMeihuaDrawQuota(...args),
}));

// NOTE: @/lib/meihua/draw is the real (pure) lib — we want its real output.

import { POST } from './route';

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://test/api/meihua/draw', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...headers },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

async function readFirstChunk(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const { value } = await reader.read();
  await reader.cancel();
  return new TextDecoder().decode(value);
}

beforeEach(() => {
  vi.clearAllMocks();
  // Stub fetch so no AI network call ever happens; force fallback path.
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network blocked'); }));
  getCache.mockResolvedValue(null);
  setCache.mockResolvedValue(undefined);
});

describe('POST /api/meihua/draw', () => {
  it('returns 401 when unauthenticated and no debug token', async () => {
    getServerSession.mockResolvedValue(null);
    const res = await POST(makeReq({ method: 'number', numbers: { num1: 1, num2: 1 } }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: '请先登录' });
  });

  it('returns 400 for an invalid method', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(makeReq({ method: 'bogus' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: '无效的起卦方式' });
  });

  it("returns 400 for method 'manual' (not yet available)", async () => {
    getServerSession.mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(makeReq({ method: 'manual' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('手动起卦');
  });

  it("valid 'number' draw (1,1) streams 200 SSE with lib-computed meta (乾)", async () => {
    getServerSession.mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(makeReq({ method: 'number', numbers: { num1: 1, num2: 1 } }));

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/event-stream');

    const chunk = await readFirstChunk(res);
    // First SSE event carries the meta object with the deterministic lib output.
    expect(chunk.startsWith('data:')).toBe(true);
    const payload = JSON.parse(chunk.replace(/^data:\s*/, '').trim());
    // num1=1 -> 乾 (upper), num2=1 -> 乾 (lower)
    expect(payload.meta.upper).toBe('乾');
    expect(payload.meta.lower).toBe('乾');
    // fetch was stubbed to throw -> fallback source
    expect(payload.meta._source).toBe('fallback');
  });

  it('serves cached analysis as a 200 SSE stream when cache hits', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'u1' } });
    getCache.mockResolvedValue({ analysis: '【卦象含义】测试缓存内容。整体可为。' });

    const res = await POST(makeReq({ method: 'number', numbers: { num1: 1, num2: 1 } }));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/event-stream');

    const chunk = await readFirstChunk(res);
    const payload = JSON.parse(chunk.replace(/^data:\s*/, '').trim());
    expect(payload.meta._source).toBe('cache');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
