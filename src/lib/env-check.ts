const REQUIRED_VARS = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'DEEPSEEK_API_KEY'] as const

const OPTIONAL_VARS = [
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'RESEND_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'WECHAT_APP_ID',
  'WECHAT_APP_SECRET',
  'ADMIN_EMAILS',
] as const

export interface EnvCheckResult {
  valid: boolean
  missing: string[]
  warnings: string[]
}

export function checkEnv(): EnvCheckResult {
  const missing: string[] = []
  const warnings: string[] = []

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  for (const key of OPTIONAL_VARS) {
    if (!process.env[key]) {
      warnings.push(key)
    }
  }

  if (process.env.NODE_ENV === 'development' && (missing.length > 0 || warnings.length > 0)) {
    if (missing.length > 0) {
      console.error(`[Env] 缺少必要环境变量:\n  ${missing.join('\n  ')}`)
      console.error('[Env] 请复制 .env.example 到 .env.local 并填写对应值')
    }
    if (warnings.length > 0) {
      console.warn(`[Env] 可选环境变量未配置（部分功能降级）:\n  ${warnings.join('\n  ')}`)
    }
  }

  return { valid: missing.length === 0, missing, warnings }
}

let _checked = false

export function assertEnv(): void {
  if (_checked) return
  _checked = true
  const result = checkEnv()
  if (!result.valid) {
    throw new Error(
      `服务启动失败: 缺少必要环境变量 [${result.missing.join(', ')}]`
    )
  }
}
