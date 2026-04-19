export interface ApiCallParams {
  route: string
  method: string
  userId?: string
  durationMs: number
  statusCode: number
  error?: string
  aiProvider?: string
  aiModel?: string
  cacheHit?: boolean
}

export function logApiCall(params: ApiCallParams) {
  const entry = {
    timestamp: new Date().toISOString(),
    route: params.route,
    method: params.method,
    durationMs: params.durationMs,
    statusCode: params.statusCode,
    ...(params.userId && { userId: params.userId }),
    ...(params.error && { error: params.error }),
    ...(params.aiProvider && { aiProvider: params.aiProvider }),
    ...(params.aiModel && { aiModel: params.aiModel }),
    ...(params.cacheHit !== undefined && { cacheHit: params.cacheHit }),
  }

  console.log(JSON.stringify(entry))

  // Future: Vercel Analytics, Sentry, OpenTelemetry
}

export function createTimer(label: string) {
  const start = Date.now()
  return {
    end(extra?: Partial<Omit<ApiCallParams, 'route' | 'durationMs'>>) {
      const durationMs = Date.now() - start
      logApiCall({
        route: label,
        method: extra?.method ?? 'INTERNAL',
        durationMs,
        statusCode: extra?.statusCode ?? 200,
        ...extra,
      })
      return durationMs
    },
    get elapsed() {
      return Date.now() - start
    },
  }
}
