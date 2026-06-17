import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// --- Prisma mock (hoisted so it is available inside the vi.mock factory) ----
const { findFirst, findUnique } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findUnique: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    subscription: { findFirst },
    usageQuota: { findUnique },
  },
}))

import { isVip, getSubscription, checkQuota } from '@/lib/subscription'

beforeEach(() => {
  // resetAllMocks clears both call history AND implementations, so a
  // mockImplementation from one test does not bleed into the next.
  vi.resetAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('subscription — isVip', () => {
  it('active sub with expireAt > now → true', async () => {
    findFirst.mockResolvedValue({ id: 's1', expireAt: new Date('2999-01-01') })
    expect(await isVip('user-a')).toBe(true)

    // Assert prisma was queried with the active + future-expiry guard.
    const where = findFirst.mock.calls[0][0].where
    expect(where).toMatchObject({ userId: 'user-a', status: 'active' })
    expect(where.expireAt).toHaveProperty('gt')
  })

  it('no matching active sub → false', async () => {
    findFirst.mockResolvedValue(null)
    expect(await isVip('user-expired')).toBe(false)
  })

  it('per-user cache: different users do not leak', async () => {
    // Resolve based on the queried userId so cache keying is what is under test
    // (not call ordering). Unique ids avoid the module-level cache from leaking
    // across tests.
    findFirst.mockImplementation(async ({ where }: { where: { userId: string } }) =>
      where.userId === 'leak-a' ? { id: 's1', expireAt: new Date('2999-01-01') } : null
    )

    expect(await isVip('leak-a')).toBe(true)
    expect(await isVip('leak-b')).toBe(false)

    // Re-querying each user serves from cache → no extra DB calls.
    expect(await isVip('leak-a')).toBe(true)
    expect(await isVip('leak-b')).toBe(false)
    expect(findFirst).toHaveBeenCalledTimes(2)
  })

  it('caches result for 30s, re-queries after TTL expires', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-16T00:00:00Z'))

    findFirst.mockResolvedValue({ id: 's1', expireAt: new Date('2999-01-01') })

    expect(await isVip('user-ttl')).toBe(true)
    expect(findFirst).toHaveBeenCalledTimes(1)

    // 29s later → still cached.
    vi.setSystemTime(new Date('2026-06-16T00:00:29Z'))
    expect(await isVip('user-ttl')).toBe(true)
    expect(findFirst).toHaveBeenCalledTimes(1)

    // 31s later → cache expired, re-query.
    vi.setSystemTime(new Date('2026-06-16T00:00:31Z'))
    expect(await isVip('user-ttl')).toBe(true)
    expect(findFirst).toHaveBeenCalledTimes(2)
  })
})

describe('subscription — getSubscription', () => {
  it('returns the active sub ordered by latest expiry', async () => {
    const sub = { id: 's9', expireAt: new Date('2999-01-01') }
    findFirst.mockResolvedValue(sub)
    expect(await getSubscription('user-g')).toBe(sub)
    expect(findFirst.mock.calls[0][0].orderBy).toEqual({ expireAt: 'desc' })
  })
})

describe('subscription — checkQuota', () => {
  it('VIP → unlimited (limit Infinity, hasQuota true) regardless of usage', async () => {
    // isVip cache may carry over; use a fresh user and active sub.
    findFirst.mockResolvedValue({ id: 's1', expireAt: new Date('2999-01-01') })
    findUnique.mockResolvedValue({ baziAiCount: 5 })

    const res = await checkQuota('cq-vip')
    expect(res.hasQuota).toBe(true)
    expect(res.limit).toBe(Infinity)
    expect(res.baziAiCount).toBe(5)
  })

  it('free user under limit → hasQuota true', async () => {
    findFirst.mockResolvedValue(null)
    findUnique.mockResolvedValue({ baziAiCount: 0 })

    const res = await checkQuota('cq-free-under')
    expect(res.hasQuota).toBe(true)
    expect(res.limit).toBe(1)
  })

  it('free user at limit → hasQuota false', async () => {
    findFirst.mockResolvedValue(null)
    findUnique.mockResolvedValue({ baziAiCount: 1 })

    const res = await checkQuota('cq-free-at')
    expect(res.hasQuota).toBe(false)
  })

  it('checkQuota date is Beijing time (consistent with quota.ts getTodayBeijing)', async () => {
    // NOTE: checkQuota uses getTodayBeijing() (Beijing UTC+8), same as quota.ts.
    // The original task brief flagged a possible UTC/Beijing inconsistency, but the
    // current source computes the date via getTodayBeijing() — documented here.
    findFirst.mockResolvedValue(null)
    findUnique.mockResolvedValue({ baziAiCount: 0 })

    vi.useFakeTimers()
    // 20:00Z is 2026-06-17 in Beijing.
    vi.setSystemTime(new Date('2026-06-16T20:00:00Z'))

    const res = await checkQuota('cq-date')
    expect(res.date).toBe('2026-06-17')
    expect(findUnique.mock.calls[0][0].where.userId_date.date).toBe('2026-06-17')
  })
})
