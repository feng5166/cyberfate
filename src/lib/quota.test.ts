import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// --- Prisma mock (hoisted so it is available inside the vi.mock factory) ----
const { updateMany, upsert, findUnique, $transaction, isVipMock } = vi.hoisted(() => {
  const updateMany = vi.fn()
  const upsert = vi.fn()
  const findUnique = vi.fn()
  // $transaction(fn) just runs the callback with a tx that proxies to our mocks.
  const $transaction = vi.fn(async (fn: (tx: unknown) => unknown) =>
    fn({ usageQuota: { upsert, updateMany, findUnique } })
  )
  const isVipMock = vi.fn(async () => false)
  return { updateMany, upsert, findUnique, $transaction, isVipMock }
})

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction,
    usageQuota: { upsert, updateMany, findUnique },
  },
}))

// isVip is mocked so quota tests don't hit subscription/db. Default: not VIP.
vi.mock('@/lib/subscription', () => ({
  isVip: isVipMock,
}))

import {
  checkBaziQuota,
  useBaziQuota,
  checkLiuyaoQuota,
  checkMeihuaDecideQuota,
  checkDailyQuota,
  peekBaziQuota,
  deductBaziQuota,
  refundQuota,
} from '@/lib/quota'

beforeEach(() => {
  vi.clearAllMocks()
  isVipMock.mockResolvedValue(false)
  upsert.mockResolvedValue({})
})

afterEach(() => {
  vi.useRealTimers()
})

describe('quota — atomic check & consume (baziAiCount)', () => {
  it('allows when under limit and guards updateMany with { baziAiCount: { lt: limit } }', async () => {
    updateMany.mockResolvedValue({ count: 1 })

    const res = await checkBaziQuota('user-1')

    expect(res).toEqual({ hasQuota: true, limit: 1, isVip: false })
    expect(updateMany).toHaveBeenCalledTimes(1)

    const arg = updateMany.mock.calls[0][0]
    // The atomic guard: only increments rows still below the limit.
    expect(arg.where).toMatchObject({
      userId: 'user-1',
      baziAiCount: { lt: 1 },
    })
    expect(arg.data).toMatchObject({ baziAiCount: { increment: 1 } })
    // upsert runs inside the same transaction before the guarded increment.
    expect(upsert).toHaveBeenCalledTimes(1)
  })

  it('denies when at/over limit (updateMany returns count 0)', async () => {
    updateMany.mockResolvedValue({ count: 0 })

    const res = await checkBaziQuota('user-1')

    expect(res).toEqual({ hasQuota: false, limit: 1, isVip: false })
  })

  // T11 · 竞态回归:updateMany 的条件自增(where {field: {lt: limit}} + increment)
  // 是原子的,故并发下不会「双花」。这里用忠实模拟原子后端的 stateful mock
  // (check+increment 在同一同步块内完成,无 await 缝隙 → 等价 DB 行锁),
  // 验证调用方依赖 count>0 的判定在 N 并发下恰好放行 limit 次。
  it('并发 N 次:原子扣减恰好放行 limit 次,计数不超发(不双花)', async () => {
    let counter = 0
    // 忠实模拟:仅当当前计数 < 传入 limit 时自增并 count:1,否则 count:0
    updateMany.mockImplementation(async (arg: any) => {
      const limit = arg.where.baziAiCount.lt as number // 真实 limit 来自被测代码
      if (counter < limit) {
        counter++
        return { count: 1 }
      }
      return { count: 0 }
    })

    const N = 12
    const results = await Promise.all(
      Array.from({ length: N }, () => checkBaziQuota('user-race')),
    )
    const granted = results.filter((r) => r.hasQuota).length

    expect(granted).toBe(1) // 八字 limit=1:并发 12 次只有 1 次拿到额度
    expect(counter).toBe(1) // 计数严格不超发
    expect(updateMany).toHaveBeenCalledTimes(N) // 每次并发都走了原子判定
  })

  it('并发同样保护高额度(模拟 limit=3 恰好放行 3 次)', async () => {
    let counter = 0
    const LIMIT = 3 // 模拟一个额度为 3 的原子后端,验证放行数=额度、通用不双花
    updateMany.mockImplementation(async () => {
      if (counter < LIMIT) {
        counter++
        return { count: 1 }
      }
      return { count: 0 }
    })

    const results = await Promise.all(
      Array.from({ length: 10 }, () => checkBaziQuota('user-race-3')),
    )
    expect(results.filter((r) => r.hasQuota).length).toBe(LIMIT)
    expect(counter).toBe(LIMIT)
  })

  it('useBaziQuota mirrors checkBaziQuota.hasQuota', async () => {
    updateMany.mockResolvedValueOnce({ count: 1 })
    expect(await useBaziQuota('user-1')).toBe(true)

    updateMany.mockResolvedValueOnce({ count: 0 })
    expect(await useBaziQuota('user-1')).toBe(false)
  })

  it('VIP short-circuits: returns unlimited and never touches the DB', async () => {
    isVipMock.mockResolvedValue(true)

    const res = await checkBaziQuota('vip-user')

    expect(res).toEqual({ hasQuota: true, limit: -1, isVip: true })
    expect($transaction).not.toHaveBeenCalled()
    expect(updateMany).not.toHaveBeenCalled()
  })

  it('liuyao uses limit 1 and respects passed-in vipStatus (no isVip call)', async () => {
    updateMany.mockResolvedValue({ count: 1 })

    const res = await checkLiuyaoQuota('user-2', false)

    expect(res.limit).toBe(1)
    expect(updateMany.mock.calls[0][0].where).toMatchObject({
      liuyaoCount: { lt: 1 },
    })
    // vipStatus supplied → isVip must not be queried.
    expect(isVipMock).not.toHaveBeenCalled()
  })

  it('liuyao with vipStatus=true short-circuits', async () => {
    const res = await checkLiuyaoQuota('user-2', true)
    expect(res).toEqual({ hasQuota: true, limit: -1, isVip: true })
    expect(isVipMock).not.toHaveBeenCalled()
  })
})

describe('quota — peekBaziQuota (read-only)', () => {
  it('hasQuota=true when used < limit, no write', async () => {
    findUnique.mockResolvedValue({ baziAiCount: 0 })
    const res = await peekBaziQuota('user-1', false)
    expect(res).toEqual({ hasQuota: true, isVip: false })
    expect(updateMany).not.toHaveBeenCalled()
  })

  it('hasQuota=false when already at limit', async () => {
    findUnique.mockResolvedValue({ baziAiCount: 1 })
    const res = await peekBaziQuota('user-1', false)
    expect(res.hasQuota).toBe(false)
  })

  it('treats missing quota row as 0 used', async () => {
    findUnique.mockResolvedValue(null)
    const res = await peekBaziQuota('user-1', false)
    expect(res.hasQuota).toBe(true)
  })

  it('VIP short-circuits without reading the DB', async () => {
    const res = await peekBaziQuota('vip', true)
    expect(res).toEqual({ hasQuota: true, isVip: true })
    expect(findUnique).not.toHaveBeenCalled()
  })

  it('queries isVip when vipStatus omitted', async () => {
    isVipMock.mockResolvedValue(false)
    findUnique.mockResolvedValue({ baziAiCount: 0 })
    const res = await peekBaziQuota('user-1')
    expect(isVipMock).toHaveBeenCalledWith('user-1')
    expect(res.hasQuota).toBe(true)
  })
})

describe('quota — 其余 AI 模块限额(3/天)', () => {
  it('梅花决策用 meihuaDecideCount, limit 1', async () => {
    updateMany.mockResolvedValue({ count: 1 })
    const res = await checkMeihuaDecideQuota('u', false)
    expect(res.limit).toBe(1)
    expect(updateMany.mock.calls[0][0].where).toMatchObject({ meihuaDecideCount: { lt: 1 } })
  })

  it('每日运势用 dailyCount, limit 1', async () => {
    updateMany.mockResolvedValue({ count: 0 })
    const res = await checkDailyQuota('u', false)
    expect(res).toEqual({ hasQuota: false, limit: 1, isVip: false })
    expect(updateMany.mock.calls[0][0].where).toMatchObject({ dailyCount: { lt: 1 } })
  })
})

describe('quota — deductBaziQuota / refundQuota', () => {
  it('deductBaziQuota upsert 自增,create 初值为 1', async () => {
    await deductBaziQuota('user-1')
    expect(upsert).toHaveBeenCalledTimes(1)
    const arg = upsert.mock.calls[0][0]
    expect(arg.update).toMatchObject({ baziAiCount: { increment: 1 } })
    expect(arg.create).toMatchObject({ baziAiCount: 1 })
  })

  it('refundQuota 仅对 >0 的行 decrement', async () => {
    updateMany.mockResolvedValue({ count: 1 })
    await refundQuota('user-1', 'liuyaoCount')
    const arg = updateMany.mock.calls[0][0]
    expect(arg.where).toMatchObject({ userId: 'user-1', liuyaoCount: { gt: 0 } })
    expect(arg.data).toMatchObject({ liuyaoCount: { decrement: 1 } })
  })
})

describe('quota — date key is computed in Beijing time (UTC+8)', () => {
  it('uses the Beijing calendar day, which can differ from the UTC day', async () => {
    updateMany.mockResolvedValue({ count: 1 })

    // 2026-06-16T20:00:00Z is still 2026-06-16 in UTC,
    // but 2026-06-17 04:00 in Beijing (UTC+8) → date key must be 2026-06-17.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-16T20:00:00Z'))

    await checkBaziQuota('user-1')

    const where = updateMany.mock.calls[0][0].where
    expect(where.date).toBe('2026-06-17')

    // And the upsert in the same transaction keys off the same Beijing date.
    expect(upsert.mock.calls[0][0].where.userId_date.date).toBe('2026-06-17')
  })

  it('stays on the UTC day when Beijing has not rolled over yet', async () => {
    updateMany.mockResolvedValue({ count: 1 })
    vi.useFakeTimers()
    // 10:00Z → 18:00 Beijing, same calendar day.
    vi.setSystemTime(new Date('2026-06-16T10:00:00Z'))

    await checkBaziQuota('user-1')

    expect(updateMany.mock.calls[0][0].where.date).toBe('2026-06-16')
  })
})
