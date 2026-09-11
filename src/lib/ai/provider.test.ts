import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const redisMock = { get: vi.fn() };
vi.mock('@/lib/cache/redis', () => ({ redis: redisMock }));
vi.mock('./circuitBreaker', () => ({ withCircuitBreaker: (_name: string, fn: () => Promise<unknown>) => fn() }));

describe('AI provider model resolution', () => {
  const original = {
    official: process.env.DEEPSEEK_OFFICIAL_API_KEY,
    modelverse: process.env.DEEPSEEK_API_KEY,
    mvModel: process.env.AI_MODELVERSE_MODEL,
    mvFallback: process.env.AI_MODELVERSE_FALLBACK_MODEL,
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.AI_MODELVERSE_MODEL;
    delete process.env.AI_MODELVERSE_FALLBACK_MODEL;
    process.env.DEEPSEEK_OFFICIAL_API_KEY = 'official-test-key';
    process.env.DEEPSEEK_API_KEY = 'modelverse-test-key';
    redisMock.get.mockResolvedValue(null);
  });

  afterEach(() => {
    for (const [key, value] of [
      ['DEEPSEEK_OFFICIAL_API_KEY', original.official],
      ['DEEPSEEK_API_KEY', original.modelverse],
      ['AI_MODELVERSE_MODEL', original.mvModel],
      ['AI_MODELVERSE_FALLBACK_MODEL', original.mvFallback],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.unstubAllGlobals();
  });

  it('uses provider-specific defaults', async () => {
    const { resolveProviders } = await import('./provider');
    const providers = await resolveProviders();
    expect(providers[0]).toMatchObject({
      id: 'deepseek-official',
      model: 'deepseek-v4-pro',
      fallbackModel: 'deepseek-v4-flash',
    });
    expect(providers[1]).toMatchObject({
      id: 'modelverse',
      model: 'deepseek-v4-pro-sg',
      fallbackModel: 'deepseek-v4-flash-sg',
    });
  });

  it('allows ModelVerse model overrides', async () => {
    process.env.AI_MODELVERSE_MODEL = 'custom-pro';
    process.env.AI_MODELVERSE_FALLBACK_MODEL = 'custom-flash';
    const { resolveProviders } = await import('./provider');
    const providers = await resolveProviders();
    expect(providers[1]).toMatchObject({ model: 'custom-pro', fallbackModel: 'custom-flash' });
  });

  it('切换到 ModelVerse 时发送其对应模型名', async () => {
    const calls: Array<{ url: string; body: { model: string } }> = [];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { model: string };
      calls.push({ url: String(input), body });
      if (calls.length === 1) return new Response(JSON.stringify({ error: 'bad request' }), { status: 400 });
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }), { status: 200 });
    }));
    const { callDeepSeek } = await import('./client');
    await expect(callDeepSeek('return json', 'test', 20, 'default')).resolves.toBe('{"ok":true}');
    expect(calls.map((c) => c.body.model)).toEqual(['deepseek-v4-pro', 'deepseek-v4-pro-sg']);
  });
});
