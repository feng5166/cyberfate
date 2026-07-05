import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- mocks (hoisted) ---
const { redisMock, sendFeishuText, feishuConfigured } = vi.hoisted(() => ({
  redisMock: { incr: vi.fn(), expire: vi.fn(), get: vi.fn(), set: vi.fn() },
  sendFeishuText: vi.fn(async () => true),
  feishuConfigured: vi.fn(() => true),
}));

vi.mock('@/lib/cache/redis', () => ({ getRedis: () => redisMock }));
vi.mock('@/lib/feishu', () => ({
  sendFeishuText: (t: string) => sendFeishuText(t),
  feishuConfigured: () => feishuConfigured(),
}));

import { recordAiOutcome } from '@/lib/ai/observe';

beforeEach(() => {
  vi.clearAllMocks()
  feishuConfigured.mockReturnValue(true)
  redisMock.expire.mockResolvedValue(1)
  redisMock.get.mockResolvedValue(null)
  redisMock.set.mockResolvedValue('OK')
})

describe('observe · AI 回退率观测/告警', () => {
  it('cache 命中直接跳过,不打任何计数', async () => {
    await recordAiOutcome('bazi', 'cache')
    expect(redisMock.incr).not.toHaveBeenCalled()
  })

  it('deepseek 只自增 total,不碰 fallback 键', async () => {
    redisMock.incr.mockResolvedValueOnce(5) // total
    await recordAiOutcome('bazi', 'deepseek')
    // 只 incr total 一次;fallback 只读不增(deepseek 分支)
    expect(redisMock.incr).toHaveBeenCalledTimes(1)
    expect(redisMock.incr.mock.calls[0][0]).toContain(':total')
  })

  it('回退率超阈值 + 抢到冷却锁 + 已配置飞书 → 告警', async () => {
    redisMock.incr
      .mockResolvedValueOnce(25) // total >= MIN_SAMPLE(20)
      .mockResolvedValueOnce(10) // fallback → 10/25 = 40% > 30%
    redisMock.set.mockResolvedValueOnce('OK') // NX 抢锁成功
    await recordAiOutcome('daily', 'fallback')
    expect(sendFeishuText).toHaveBeenCalledTimes(1)
    expect(sendFeishuText.mock.calls[0][0]).toContain('daily')
    expect(sendFeishuText.mock.calls[0][0]).toContain('40%')
  })

  it('超阈值但冷却锁未抢到 → 不重复告警', async () => {
    redisMock.incr.mockResolvedValueOnce(30).mockResolvedValueOnce(20) // 66%
    redisMock.set.mockResolvedValueOnce(null) // NX 未抢到(已在冷却)
    await recordAiOutcome('daily', 'fallback')
    expect(sendFeishuText).not.toHaveBeenCalled()
  })

  it('样本不足(< MIN_SAMPLE)不评率,不告警', async () => {
    redisMock.incr.mockResolvedValueOnce(5).mockResolvedValueOnce(5) // 5/5=100% 但样本不足
    await recordAiOutcome('tarot', 'fallback')
    expect(sendFeishuText).not.toHaveBeenCalled()
    expect(redisMock.set).not.toHaveBeenCalled() // 未走到抢锁
  })

  it('样本够但率未超阈值 → 不告警', async () => {
    redisMock.incr.mockResolvedValueOnce(40).mockResolvedValueOnce(4) // 10% < 30%
    await recordAiOutcome('tarot', 'fallback')
    expect(sendFeishuText).not.toHaveBeenCalled()
  })

  it('飞书未配置 → 抢锁但不发(不报错)', async () => {
    feishuConfigured.mockReturnValue(false)
    redisMock.incr.mockResolvedValueOnce(25).mockResolvedValueOnce(10)
    redisMock.set.mockResolvedValueOnce('OK')
    await recordAiOutcome('daily', 'fallback')
    expect(sendFeishuText).not.toHaveBeenCalled()
  })
})
