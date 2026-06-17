import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import crypto from 'node:crypto'

// 验签逻辑已抽到纯 lib(仅依赖 node:crypto),直接 import,无需 mock 路由依赖。
import { verifyStripeWebhook, verifyCallbackSignature } from '@/lib/payment/signature'

const SECRET = 'whsec_test_secret'

function stripeHeader(payload: string, secret: string, timestamp: number): string {
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest('hex')
  return `t=${timestamp},v1=${sig}`
}

describe('Stripe webhook — verifyStripeWebhook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-16T00:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const now = () => Math.floor(Date.now() / 1000)

  it('correct signature passes and parses the event', () => {
    const payload = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' })
    const header = stripeHeader(payload, SECRET, now())

    const res = verifyStripeWebhook(payload, header, SECRET)
    expect(res.valid).toBe(true)
    expect(res.event?.id).toBe('evt_1')
  })

  it('tampered body fails (signature no longer matches)', () => {
    const payload = JSON.stringify({ id: 'evt_1', amount: 999 })
    const header = stripeHeader(payload, SECRET, now())

    const tampered = JSON.stringify({ id: 'evt_1', amount: 1 })
    const res = verifyStripeWebhook(tampered, header, SECRET)
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/verification failed/i)
  })

  it('wrong secret fails', () => {
    const payload = JSON.stringify({ id: 'evt_1' })
    const header = stripeHeader(payload, 'whsec_other', now())

    const res = verifyStripeWebhook(payload, header, SECRET)
    expect(res.valid).toBe(false)
  })

  it('timestamp outside tolerance is rejected', () => {
    const payload = JSON.stringify({ id: 'evt_1' })
    // 301s in the past, default tolerance is 300s → rejected.
    const oldTs = now() - 301
    const header = stripeHeader(payload, SECRET, oldTs)

    const res = verifyStripeWebhook(payload, header, SECRET)
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/tolerance/i)
  })

  it('timestamp just inside tolerance passes', () => {
    const payload = JSON.stringify({ id: 'evt_1' })
    const ts = now() - 299
    const header = stripeHeader(payload, SECRET, ts)
    expect(verifyStripeWebhook(payload, header, SECRET).valid).toBe(true)
  })

  it('malformed header (no timestamp) is rejected', () => {
    const payload = JSON.stringify({ id: 'evt_1' })
    const sig = crypto.createHmac('sha256', SECRET).update(`x.${payload}`).digest('hex')
    const res = verifyStripeWebhook(payload, `v1=${sig}`, SECRET)
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/timestamp/i)
  })

  it('header with no v1 signature is rejected', () => {
    const payload = JSON.stringify({ id: 'evt_1' })
    const res = verifyStripeWebhook(payload, `t=${now()}`, SECRET)
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/No signatures/i)
  })
})

describe('Payment callback — verifyCallbackSignature (HMAC)', () => {
  const CB_SECRET = 'cb_secret_123'

  beforeEach(() => {
    vi.stubEnv('CALLBACK_SECRET', CB_SECRET)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  function sign(body: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex')
  }

  it('correct signature passes', () => {
    const body = JSON.stringify({ outTradeNo: 'O1', timestamp: Date.now() })
    expect(verifyCallbackSignature(body, sign(body, CB_SECRET))).toBe(true)
  })

  it('tampered body fails', () => {
    const body = JSON.stringify({ outTradeNo: 'O1', timestamp: 1 })
    const sig = sign(body, CB_SECRET)
    const tampered = JSON.stringify({ outTradeNo: 'O2', timestamp: 1 })
    expect(verifyCallbackSignature(tampered, sig)).toBe(false)
  })

  it('wrong secret fails', () => {
    const body = JSON.stringify({ outTradeNo: 'O1' })
    expect(verifyCallbackSignature(body, sign(body, 'nope'))).toBe(false)
  })

  it('missing signature fails', () => {
    const body = JSON.stringify({ outTradeNo: 'O1' })
    expect(verifyCallbackSignature(body, null)).toBe(false)
  })

  it('missing CALLBACK_SECRET env → rejects (fail closed)', () => {
    vi.stubEnv('CALLBACK_SECRET', '')
    const body = JSON.stringify({ outTradeNo: 'O1' })
    expect(verifyCallbackSignature(body, sign(body, CB_SECRET))).toBe(false)
  })
})
