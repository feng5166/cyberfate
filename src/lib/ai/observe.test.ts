import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- mocks (hoisted) ---
// pipeline 是链式 mock:把每条入队命令记进 calls,便于断言「一次往返、命令齐全、expire 带 NX」
const { redisMock, pipe, sendFeishuText, feishuConfigured } = vi.hoisted(() => {
  const pipe = {
    calls: [] as unknown[][],
    execCount: 0,
    result: [] as unknown[],
    incr(key: string) {
      pipe.calls.push(['incr', key]);
      return pipe;
    },
    expire(key: string, ttl: number, opt?: string) {
      pipe.calls.push(['expire', key, ttl, opt]);
      return pipe;
    },
    async exec() {
      pipe.execCount++;
      return pipe.result;
    },
  };
  return {
    pipe,
    redisMock: { pipeline: vi.fn(() => pipe), set: vi.fn() },
    sendFeishuText: vi.fn(async () => true),
    feishuConfigured: vi.fn(() => true),
  };
});

vi.mock('@/lib/cache/redis', () => ({ getRedis: () => redisMock }));
vi.mock('@/lib/feishu', () => ({
  sendFeishuText: (t: string) => sendFeishuText(t),
  feishuConfigured: () => feishuConfigured(),
}));

import { recordAiOutcome, observed } from '@/lib/ai/observe';

beforeEach(() => {
  vi.clearAllMocks();
  feishuConfigured.mockReturnValue(true);
  redisMock.set.mockResolvedValue('OK');
  pipe.calls = [];
  pipe.execCount = 0;
  pipe.result = [];
});

describe('observe · AI 回退率观测/告警', () => {
  it('cache 命中直接跳过,不打任何计数', async () => {
    await recordAiOutcome('bazi', 'cache');
    expect(redisMock.pipeline).not.toHaveBeenCalled();
  });

  it('deepseek 只自增 total:一次 pipeline 往返,完全不碰 fallback 键', async () => {
    pipe.result = [5, 1];
    await recordAiOutcome('bazi', 'deepseek');
    expect(redisMock.pipeline).toHaveBeenCalledTimes(1);
    expect(pipe.execCount).toBe(1);
    expect(pipe.calls.map((c) => c[0])).toEqual(['incr', 'expire']);
    expect(pipe.calls[0][1]).toContain(':total');
    // 旧实现在此分支多打一次 get(fallback),返回值却从未被用到 —— 回归护栏
    expect(pipe.calls.some((c) => String(c[1]).endsWith(':fallback'))).toBe(false);
  });

  it('fallback 分支把 4 条命令合并进同一次 pipeline 往返', async () => {
    pipe.result = [3, 1, 2, 1];
    await recordAiOutcome('bazi', 'fallback');
    expect(redisMock.pipeline).toHaveBeenCalledTimes(1);
    expect(pipe.execCount).toBe(1);
    expect(pipe.calls.map((c) => c[0])).toEqual(['incr', 'expire', 'incr', 'expire']);
    expect(String(pipe.calls[2][1])).toContain(':fallback');
  });

  it('expire 一律带 NX:防止每次调用重置 TTL 把计数键滑成永不过期', async () => {
    pipe.result = [3, 1, 2, 1];
    await recordAiOutcome('bazi', 'fallback');
    const expires = pipe.calls.filter((c) => c[0] === 'expire');
    expect(expires).toHaveLength(2);
    for (const e of expires) {
      expect(e[2]).toBe(172800);
      expect(e[3]).toBe('nx');
    }
  });

  it('回退率超阈值 + 抢到冷却锁 + 已配置飞书 → 告警', async () => {
    pipe.result = [25, 1, 10, 1]; // total 25 >= MIN_SAMPLE(20),10/25 = 40% > 30%
    redisMock.set.mockResolvedValueOnce('OK'); // NX 抢锁成功
    await recordAiOutcome('daily', 'fallback');
    expect(sendFeishuText).toHaveBeenCalledTimes(1);
    expect(sendFeishuText.mock.calls[0][0]).toContain('daily');
    expect(sendFeishuText.mock.calls[0][0]).toContain('40%');
  });

  it('超阈值但冷却锁未抢到 → 不重复告警', async () => {
    pipe.result = [30, 1, 20, 1]; // 66%
    redisMock.set.mockResolvedValueOnce(null); // NX 未抢到(已在冷却)
    await recordAiOutcome('daily', 'fallback');
    expect(sendFeishuText).not.toHaveBeenCalled();
  });

  it('样本不足(< MIN_SAMPLE)不评率,不告警', async () => {
    pipe.result = [5, 1, 5, 1]; // 5/5=100% 但样本不足
    await recordAiOutcome('tarot', 'fallback');
    expect(sendFeishuText).not.toHaveBeenCalled();
    expect(redisMock.set).not.toHaveBeenCalled(); // 未走到抢锁
  });

  it('样本够但率未超阈值 → 不告警', async () => {
    pipe.result = [40, 1, 4, 1]; // 10% < 30%
    await recordAiOutcome('tarot', 'fallback');
    expect(sendFeishuText).not.toHaveBeenCalled();
  });

  it('飞书未配置 → 抢锁但不发(不报错)', async () => {
    feishuConfigured.mockReturnValue(false);
    pipe.result = [25, 1, 10, 1];
    redisMock.set.mockResolvedValueOnce('OK');
    await recordAiOutcome('daily', 'fallback');
    expect(sendFeishuText).not.toHaveBeenCalled();
  });
});

describe('observed · 透传包装器', () => {
  it('原样返回入参对象,且不因无请求上下文(after 抛错)而中断调用方', async () => {
    pipe.result = [1, 1];
    const payload = { foo: 1, _source: 'deepseek' as const };
    // 单测里没有 Next 请求上下文,after() 会同步抛错 → 必须退回 void 调度而不是把错误抛给业务
    expect(() => observed('bazi', payload)).not.toThrow();
    expect(observed('bazi', payload)).toBe(payload);
    await new Promise((r) => setTimeout(r, 0));
    expect(redisMock.pipeline).toHaveBeenCalled(); // 降级路径确实把观测跑掉了
  });

  it('cache 来源不触发任何 Redis 操作', async () => {
    const payload = { _source: 'cache' as const };
    expect(observed('bazi', payload)).toBe(payload);
    await new Promise((r) => setTimeout(r, 0));
    expect(redisMock.pipeline).not.toHaveBeenCalled();
  });
});
