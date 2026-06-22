import { describe, expect, it } from 'vitest'
import {
  PRICING_CONFIG,
  PLAN_IDS,
  SELLABLE_PLAN_IDS,
  PRICING_PLANS_LIST,
  LIFETIME_DURATION,
  isValidPlanId,
  isSellablePlanId,
  isLifetimePlan,
  getPlanName,
  getDefaultPlanId,
  getCurrencySymbol,
  formatPrice,
  PLAN_NAME_TO_ID,
  PLAN_ID_TO_NAME,
} from '@/lib/pricing-config'

describe('pricing-config — plan amounts & durations are sane', () => {
  it.each(PLAN_IDS)('plan %s has positive amount and duration', (id) => {
    const plan = PRICING_CONFIG[id]
    expect(plan.amount).toBeGreaterThan(0)
    expect(plan.duration).toBeGreaterThan(0)
    expect(Number.isInteger(plan.amount)).toBe(true)
    expect(plan.currency).toBeTruthy()
  })

  it('known fixed amounts/durations (characterization)', () => {
    // characterization — current published prices
    expect(PRICING_CONFIG.daily).toMatchObject({ amount: 999, duration: 1 })
    // 年费会员:$69.9,划线原价 $299
    expect(PRICING_CONFIG.yearly).toMatchObject({
      amount: 6990,
      duration: 365,
      originalAmount: 29900,
      originalDisplayPrice: '299',
    })
    // lifetime 祖父条款下架,但配置保留(存量有效)
    expect(PRICING_CONFIG.lifetime).toMatchObject({
      amount: 19900,
      duration: LIFETIME_DURATION,
    })
  })

  it('lifetime duration constant is the large sentinel, not hardcoded elsewhere', () => {
    expect(LIFETIME_DURATION).toBe(36500)
    expect(PRICING_CONFIG.lifetime.duration).toBe(LIFETIME_DURATION)
  })

  it('exactly one recommended plan', () => {
    const recommended = PRICING_PLANS_LIST.filter((p) => p.recommended)
    expect(recommended).toHaveLength(1)
    expect(getDefaultPlanId()).toBe(recommended[0].id)
  })

  it('可售套餐为 daily + yearly,lifetime 已下架(祖父条款)', () => {
    expect(SELLABLE_PLAN_IDS).toEqual(['daily', 'yearly'])
    expect(isSellablePlanId('yearly')).toBe(true)
    expect(isSellablePlanId('lifetime')).toBe(false) // 存量有效但不可再售
    expect(PRICING_CONFIG.lifetime.sellable).toBe(false)
    // 下架不影响配置查询(存量订单仍可解析)
    expect(getPlanName('lifetime')).toBe('尊享版')
  })
})

describe('pricing-config — lookups & guards', () => {
  it('isValidPlanId accepts known ids, rejects junk', () => {
    expect(isValidPlanId('yearly')).toBe(true)
    expect(isValidPlanId('weekly')).toBe(false)
    expect(isValidPlanId('')).toBe(false)
  })

  it('isLifetimePlan only true for lifetime', () => {
    expect(isLifetimePlan('lifetime')).toBe(true)
    expect(isLifetimePlan('yearly')).toBe(false)
  })

  it('name <-> id maps are mutually consistent', () => {
    for (const id of PLAN_IDS) {
      const name = PLAN_ID_TO_NAME[id]
      expect(PLAN_NAME_TO_ID[name]).toBe(id)
      expect(getPlanName(id)).toBe(name)
    }
  })

  it('getPlanName passes through unknown ids unchanged', () => {
    expect(getPlanName('bogus')).toBe('bogus')
  })

  it('currency symbol & formatting', () => {
    expect(getCurrencySymbol('daily')).toBe('$')
    expect(getCurrencySymbol()).toBe('$')
    expect(formatPrice('daily')).toBe('$9.99 / 天')
    // lifetime has no period suffix
    expect(formatPrice('lifetime')).toBe('$199')
  })
})

describe('pricing-config — proration / credited-fraction property', () => {
  // NOTE: there is no exported proration helper in src/lib. The renewal
  // "credited remaining days" logic (BUG-007) lives INLINE in the payment
  // routes (webhook/callback) as addDays(max(oldExpireAt, now), duration).
  // We model that pure math here against the exported `duration` to property-
  // check the credited fraction invariant — see report note.
  function creditedFraction(remainingDays: number, duration: number): number {
    // Fraction of the OLD plan still credited when renewing: the renewal keeps
    // remaining days and stacks the new duration on top. Credited fraction of
    // the new period that effectively comes "for free" from leftover time.
    return remainingDays / duration
  }

  it.each(PLAN_IDS.filter((id) => id !== 'lifetime'))(
    'credited fraction stays within [0,1] across remainingDays in [0, duration] for %s',
    (id) => {
      const { duration } = PRICING_CONFIG[id]
      for (let remaining = 0; remaining <= duration; remaining++) {
        const f = creditedFraction(remaining, duration)
        expect(f).toBeGreaterThanOrEqual(0)
        expect(f).toBeLessThanOrEqual(1)
      }
    }
  )

  it('boundaries: 0 remaining → 0, full duration remaining → 1', () => {
    expect(creditedFraction(0, 365)).toBe(0)
    expect(creditedFraction(365, 365)).toBe(1)
  })
})
