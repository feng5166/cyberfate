import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks (hoisted) ---
// These routes use STATIC imports, so the mock factories run before normal
// top-level consts are initialized. Use vi.hoisted to share the spies safely.
const h = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  checkRateLimit: vi.fn(),
  checkBaziQuota: vi.fn(),
  refundQuota: vi.fn(),
  isUserVip: vi.fn(),
  generateBaziAnalysis: vi.fn(),
}));

vi.mock('next-auth', () => ({ getServerSession: h.getServerSession }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

vi.mock('@/lib/chaos-middleware', () => ({ applyChaos: vi.fn(async () => null) }));

vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: h.checkRateLimit }));

vi.mock('@/lib/quota', () => ({
  checkBaziQuota: h.checkBaziQuota,
  refundQuota: h.refundQuota,
  isUserVip: h.isUserVip,
}));

vi.mock('@/lib/ai', () => ({
  generateBaziAnalysis: h.generateBaziAnalysis,
}));

const { getServerSession, checkRateLimit, checkBaziQuota, refundQuota, generateBaziAnalysis } = h;

vi.mock('@/lib/ai/circuitBreaker', () => ({
  withCircuitBreaker: (_key: string, fn: () => unknown) => fn(),
}));
vi.mock('@/lib/ai/withTimeout', () => ({
  // Run the wrapped fn directly; ignore timeout/fallback machinery.
  withAiTimeout: (fn: () => unknown) => fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// NOTE: @/lib/bazi, zod and @/lib/utils/sanitize are kept real (deterministic calc + real validation).

import { POST } from './route';

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://test/api/bazi', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...headers },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

const validBody = {
  name: '测试',
  gender: 'male',
  birthDate: '1990-06-15',
  birthHour: 6,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network blocked'); }));
  getServerSession.mockResolvedValue({ user: { id: 'u1' } });
  checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
  checkBaziQuota.mockResolvedValue({ hasQuota: true, isVip: false });
  refundQuota.mockResolvedValue(undefined);
  generateBaziAnalysis.mockResolvedValue({
    dayMasterAnalysis: '日主分析', personality: '性格', career: '事业',
    wealth: '财运', relationship: '感情', health: '健康',
    dayunAnalysis: '大运', traits: ['稳重'], _source: 'deepseek',
  });
});

describe('POST /api/bazi', () => {
  it('returns 400 for an invalid birthDate format (zod)', async () => {
    const res = await POST(makeReq({ ...validBody, birthDate: '06/15/1990' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('输入数据格式错误');
  });

  it('returns 400 for an impossible date (Feb 30)', async () => {
    const res = await POST(makeReq({ ...validBody, birthDate: '1990-02-30' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('输入数据格式错误');
  });

  it('returns 400 when required birthHour is missing', async () => {
    const { birthHour, ...noHour } = validBody;
    void birthHour;
    const res = await POST(makeReq(noHour));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('输入数据格式错误');
  });

  it('returns 403 when quota is exhausted', async () => {
    checkBaziQuota.mockResolvedValue({ hasQuota: false, isVip: false });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('QUOTA_EXCEEDED');
  });

  it('returns 429 when rate limited', async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(429);
  });

  it('valid payload with quota allowed returns 200 with computed pillars', async () => {
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pillars).toBeDefined();
    expect(json.pillars.year).toBeDefined();
    expect(json.wuxing).toBeDefined();
    // 现行架构：本路由只做确定性排盘，AI 解读延迟到 /api/bazi/stream（按 cacheKey 流式）。
    // 故 aiAnalysis 为空串占位，且本路由不调用 generateBaziAnalysis。
    expect(json.aiAnalysis).toBe('');
    expect(json.cacheKey).toMatch(/^v6:bazi:/);
    expect(generateBaziAnalysis).not.toHaveBeenCalled();
  });

  it('cacheKey 区分精确时分/农历/晚子时，不再串档', async () => {
    const keyOf = async (body: unknown) => (await (await POST(makeReq(body))).json()).cacheKey as string;

    // 同一粗时辰、不同精确分钟 → 必须不同 key
    const base = { ...validBody, knowTime: true, birthHourNum: 6, birthMinute: 10 };
    const k0610 = await keyOf(base);
    const k0650 = await keyOf({ ...base, birthMinute: 50 });
    expect(k0610).not.toBe(k0650);

    // 农历 vs 阳历同年月日 → 必须不同 key
    const kSolar = await keyOf(validBody);
    const kLunar = await keyOf({ ...validBody, isLunar: true });
    expect(kSolar).not.toBe(kLunar);

    // 晚子时 vs 早子时 → 必须不同 key
    const ziBase = { ...validBody, knowTime: true, birthHourNum: 23, birthMinute: 30 };
    const kEarly = await keyOf(ziBase);
    const kLate = await keyOf({ ...ziBase, lateZiShi: true });
    expect(kEarly).not.toBe(kLate);

    // 逻辑相同的输入 → 必须同 key（缓存可复用，不碎裂）
    expect(await keyOf(validBody)).toBe(await keyOf({ ...validBody, name: '另一个名字' }));
  });

  it('allows a guest (no session) when guest rate limit permits', async () => {
    getServerSession.mockResolvedValue(null);
    const res = await POST(makeReq(validBody));
    // Guests are allowed to try (no quota gate); should compute a result.
    expect(res.status).toBe(200);
    // guest path should not touch user quota
    expect(checkBaziQuota).not.toHaveBeenCalled();
  });
});
