import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  cache: vi.fn(),
  refund: vi.fn(),
  alert: vi.fn(),
}));

vi.mock('next-auth', () => ({ getServerSession: async () => ({ user: { id: 'test-user' } }) }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/quota', () => ({
  atomicCheckAndConsume: async () => ({ hasQuota: true, isVip: false }),
  isUserVip: async () => false,
  refundQuota: mocks.refund,
}));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ allowed: true }) }));
vi.mock('@/lib/cache/redis', () => ({ redis: { get: async () => null, set: mocks.cache } }));
vi.mock('@/lib/ai/provider', () => ({
  resolveProviders: async () => [
    { id: 'deepseek-official', baseUrl: 'https://official.test', apiKey: 'test-official', model: 'deepseek-v4-pro' },
    { id: 'modelverse', baseUrl: 'https://gateway.test/v1', apiKey: 'test-gateway', model: 'deepseek-v4-pro-sg' },
  ],
}));
vi.mock('@/lib/ai/client', () => ({ generateFallbackBaziAnalysis: () => ({}) }));
vi.mock('@/lib/ai/formatAnalysis', () => ({ formatAnalysis: () => 'fallback' }));
vi.mock('@/lib/bazi/tools', () => ({ runBaziToolchain: () => [], toolchainToPromptFacts: () => '' }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/feishu', () => ({ sendFeishuText: mocks.alert }));

import { POST } from './route';

describe('八字流式解读的 provider 模型切换', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mocks.fetch);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('官方请求失败后用网关自身的模型完成正文并缓存，不触发降级告警', async () => {
    const analysis = '【事业攻守】' + '根据命盘给出可执行的工作和学习建议。'.repeat(15);
    mocks.fetch.mockImplementation(async (url: string, options: RequestInit) => {
      const body = JSON.parse(String(options.body));
      if (url.startsWith('https://official.test')) {
        expect(body.model).toBe('deepseek-v4-pro');
        return Response.json({ error: 'provider unavailable' }, { status: 503 });
      }
      // ModelVerse 不接受官方短名；发送错误模型必须使本用例失败。
      if (body.model !== 'deepseek-v4-pro-sg') {
        return Response.json({ error: 'model is offline' }, { status: 400 });
      }
      return new Response(
        `data: ${JSON.stringify({ choices: [{ delta: { content: analysis } }] })}\n\ndata: [DONE]\n\n`,
        { headers: { 'Content-Type': 'text/event-stream' } },
      );
    });

    const request = new NextRequest('https://cyberfate.test/api/bazi/stream', {
      method: 'POST',
      body: JSON.stringify({ cacheKey: 'test-chart', baziResult: {}, topic: 'career' }),
    });
    const response = await POST(request);
    const frames = (await response.text()).split('\n')
      .filter(line => line.startsWith('data:'))
      .map(line => JSON.parse(line.slice(5)));

    expect(response.status).toBe(200);
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(frames).toContainEqual({ done: true, source: 'deepseek', aiAnalysis: analysis });
    expect(frames.some(frame => frame.fallback)).toBe(false);
    expect(mocks.cache).toHaveBeenCalledWith('test-chart:topic:career', analysis, { ex: 2592000 });
    expect(mocks.refund).not.toHaveBeenCalled();
    expect(mocks.alert).not.toHaveBeenCalled();
  });
});
