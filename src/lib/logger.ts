import { getRequestId } from '@/lib/request-id'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  service: string
  message: string
  userId?: string
  error?: string
  durationMs?: number
  meta?: Record<string, unknown>
  ts: string
  requestId?: string
}

function maskUserId(id: string): string {
  if (!id || id.length <= 8) return '***'
  return id.substring(0, 4) + '***'
}

export function log(entry: Omit<LogEntry, 'ts'> & { level?: LogLevel }) {
  const logEntry: LogEntry = {
    level: entry.level ?? 'info',
    service: entry.service,
    message: entry.message,
    ts: new Date().toISOString(),
    ...(entry.userId != null && { userId: maskUserId(entry.userId) }),
    ...(entry.error != null && { error: entry.error }),
    ...(entry.durationMs != null && { durationMs: entry.durationMs }),
    ...(entry.meta != null && { meta: entry.meta }),
    ...(entry.requestId != null ? { requestId: entry.requestId } : {}),
  }

  // Auto-include requestId from AsyncLocalStorage if available
  const contextRequestId = getRequestId()
  if (contextRequestId && !logEntry.requestId) {
    logEntry.requestId = contextRequestId
  }

  const line = JSON.stringify(logEntry)

  switch (logEntry.level) {
    case 'error': console.error(line); break
    case 'warn':  console.warn(line);  break
    case 'debug': console.debug(line); break
    default:      console.log(line);   break
  }
}

export const logger = {
  info: (service: string, message: string, meta?: Record<string, unknown>) =>
    log({ level: 'info', service, message, meta }),

  warn: (service: string, message: string, meta?: Record<string, unknown>) =>
    log({ level: 'warn', service, message, meta }),

  error: (service: string, message: string, error?: Error | unknown, meta?: Record<string, unknown>) =>
    log({
      level: 'error',
      service,
      message,
      error: error instanceof Error ? error.message : (error != null ? String(error) : undefined),
      meta,
    }),

  debug: (service: string, message: string, meta?: Record<string, unknown>) =>
    log({ level: 'debug', service, message, meta }),
}
