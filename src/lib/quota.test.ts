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
    // 热路径（当日行已存在）：单次条件自增即完成，不再 upsert、不开事务
    expect(upsert).not.toHaveBeenCalled()
    expect($transaction).not.toHaveBeenCalled()
  })

  it('当日首笔：行不存在时 upsert 建行（空更新）后重试一次扣减', async () => {
    updateMany
      .mockResolvedValueOnce({ count: 0 }) // 行不存在 → 首次条件自增落空
      .mockResolvedValueOnce({ count: 1 }) // 建行后重试成功

    const res = await checkBaziQuota('user-new')

    expect(res).toEqual({ hasQuota: true, limit: 1, isVip: false })
    expect(upsert).toHaveBeenCalledTimes(1)
    expect(updateMany).toHaveBeenCalledTimes(2)
    // upsert 只建行不改计数：update 为空对象，扣减仍由条件 updateMany 原子完成
    expect(upsert.mock.calls[0][0].update).toEqual({})
  })

  it('denies when at/over limit (updateMany returns count 0 twice)', async () => {
    updateMany.mockResolvedValue({ count: 0 })

    const res = await checkBaziQuota('user-1')

    expect(res).toEqual({ hasQuota: false, limit: 1, isVip: false })
    // 额度耗尽路径：首扣落空 → upsert 幂等建行 → 重扣仍落空
    expect(updateMany).toHaveBeenCalledTimes(2)
    // vipStatus 未传：入口已真查过 isVip，额度耗尽时不再复核
    expect(isVipMock).toHaveBeenCalledTimes(1)
  })

  it('vipStatus=false 且额度耗尽：复核 isVip，确为 VIP（JWT 未刷）则放行', async () => {
    updateMany.mockResolvedValue({ count: 0 })
    isVipMock.mockResolvedValue(true) // DB 里已是 VIP，但 JWT 还没刷新

    const res = await checkLiuyaoQuota('user-just-paid', false)

    expect(res).toEqual({ hasQuota: true, limit: -1, isVip: true })
    expect(isVipMock).toHaveBeenCalledWith('user-just-paid')
  })

  it('vipStatus=false 且额度耗尽：复核仍非 VIP → 拒绝', async () => {
    updateMany.mockResolvedValue({ count: 0 })
    isVipMock.mockResolvedValue(false)

    const res = await checkLiuyaoQuota('user-free', false)

    expect(res).toEqual({ hasQuota: false, limit: 1, isVip: false })
    expect(isVipMock).toHaveBeenCalledTimes(1)
  })

  it('vipStatus=false 但额度未尽：直接放行，不复核 isVip', async () => {
    updateMany.mockResolvedValue({ count: 1 })

    const res = await checkLiuyaoQuota('user-2', false)

    expect(res.hasQuota).toBe(true)
    expect(isVipMock).not.toHaveBeenCalled()
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
    // 放行的 1 次走热路径(1 次 updateMany);被拒的 N-1 次各 2 次(首扣落空 → upsert → 重扣仍落空)
    expect(updateMany).toHaveBeenCalledTimes(1 + (N - 1) * 2)
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

    // 拒绝路径会「首扣 → 建行 → 重扣」调用两次 updateMany
    updateMany.mockResolvedValue({ count: 0 })
    expect(await useBaziQuota('user-1')).toBe(false)
  })

  it('VIP short-circuits: returns unlimited and never touches the DB', async () => {
    isVipMock.mockResolvedValue(true)

    const res = await checkBaziQuota('vip-user')

    expect(res).toEqual({ hasQuota: true, limit: -1, isVip: true })
    expect($transaction).not.toHaveBeenCalled()
    expect(updateMany).not.toHaveBeenCalled()
  })

  it('liuyao uses limit 1 and respects passed-in vipStatus=false (no isVip call)', async () => {
    updateMany.mockResolvedValue({ count: 1 })

    const res = await checkLiuyaoQuota('user-2', false)

    expect(res.limit).toBe(1)
    expect(updateMany.mock.calls[0][0].where).toMatchObject({
      liuyaoCount: { lt: 1 },
    })
    // vipStatus=false 是保守方向，可信任 → 不查 isVip
    expect(isVipMock).not.toHaveBeenCalled()
  })

  it('vipStatus=true 仍复核 DB：确为 VIP 才不限量', async () => {
    isVipMock.mockResolvedValue(true)

    const res = await checkLiuyaoQuota('user-2', true)

    expect(res).toEqual({ hasQuota: true, limit: -1, isVip: true })
    // 放行前必须真查过 DB（vipStatus 不是放行凭证）
    expect(isVipMock).toHaveBeenCalledWith('user-2')
    expect(updateMany).not.toHaveBeenCalled()
  })

  // 回归：移动端 JWT MAX_AGE 30 天且只 decode 不查库，订阅到期后 isSubscribed:true 会被固化，
  // 若拿它直接放行，用户可无限量白嫖 AI 且 UsageQuota 计数为 0（平台完全无感）
  it('stale isSubscribed=true 但 DB 无有效订阅：不得放行，照常扣配额', async () => {
    isVipMock.mockResolvedValue(false) // DB 里订阅已过期
    updateMany.mockResolvedValue({ count: 1 })

    const res = await checkLiuyaoQuota('user-stale-token', true)

    expect(res).toEqual({ hasQuota: true, limit: 1, isVip: false })
    expect(isVipMock).toHaveBeenCalledWith('user-stale-token')
    // 关键：走了真实扣减，而不是 VIP 零 DB 短路
    expect(updateMany).toHaveBeenCalledTimes(1)
    expect(updateMany.mock.calls[0][0].data).toMatchObject({ liuyaoCount: { increment: 1 } })
  })

  it('stale isSubscribed=true + 额度已尽：直接拒绝（不再二次复核）', async () => {
    isVipMock.mockResolvedValue(false)
    updateMany.mockResolvedValue({ count: 0 })

    const res = await checkLiuyaoQuota('user-stale-exhausted', true)

    expect(res).toEqual({ hasQuota: false, limit: 1, isVip: false })
    // 入口已复核过一次，耗尽分支只对 vipStatus===false 生效 → 总共 1 次
    expect(isVipMock).toHaveBeenCalledTimes(1)
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

  it('vipStatus=true 经 DB 复核确认后才报不限量', async () => {
    isVipMock.mockResolvedValue(true)
    const res = await peekBaziQuota('vip', true)
    expect(res).toEqual({ hasQuota: true, isVip: true })
    expect(isVipMock).toHaveBeenCalledWith('vip')
    expect(findUnique).not.toHaveBeenCalled()
  })

  it('stale vipStatus=true 但 DB 非 VIP：按免费用户读真实用量', async () => {
    isVipMock.mockResolvedValue(false)
    findUnique.mockResolvedValue({ baziAiCount: 1 })

    const res = await peekBaziQuota('stale-vip', true)

    expect(res).toEqual({ hasQuota: false, isVip: false })
    expect(findUnique).toHaveBeenCalledTimes(1)
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
    // 首扣落空 → 走 upsert 建行分支，顺便验证 upsert 也用同一北京日期键
    updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })

    // 2026-06-16T20:00:00Z is still 2026-06-16 in UTC,
    // but 2026-06-17 04:00 in Beijing (UTC+8) → date key must be 2026-06-17.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-16T20:00:00Z'))

    await checkBaziQuota('user-1')

    const where = updateMany.mock.calls[0][0].where
    expect(where.date).toBe('2026-06-17')

    // upsert 建行同样以北京日期为键
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
