export interface SubscriptionData {
  plan: string | null
  plan_name: string
  price: number
  currency: string
  status: 'active' | 'cancelled' | 'none' | 'past_due'
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  pending_plan: string | null
  pending_plan_date: string | null
  auto_renew?: boolean
  payment_method: {
    type: string
    last4: string
  } | null
}

export interface Invoice {
  id: string
  date: string
  description: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  invoice_url: string | null
}

export const PLAN_CONFIG: Record<string, { name: string; rank: number; price: number; period: string; duration: number }> = {
  monthly: { name: '基础版', rank: 1, price: 29, period: '/月', duration: 30 },
  quarterly: { name: '专业版', rank: 2, price: 69, period: '/季', duration: 90 },
  yearly: { name: '尊享版', rank: 3, price: 199, period: '/年', duration: 365 },
}
