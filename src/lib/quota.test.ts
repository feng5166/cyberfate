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
  peekBaziQuota,
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

  it('liuyao uses limit 3 and respects passed-in vipStatus (no isVip call)', async () => {
    updateMany.mockResolvedValue({ count: 1 })

    const res = await checkLiuyaoQuota('user-2', false)

    expect(res.limit).toBe(3)
    expect(updateMany.mock.calls[0][0].where).toMatchObject({
      liuyaoCount: { lt: 3 },
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
