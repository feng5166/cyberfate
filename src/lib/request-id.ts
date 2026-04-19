import { AsyncLocalStorage } from 'async_hooks'
import { randomUUID } from 'crypto'

const requestIdStore = new AsyncLocalStorage<string>()

export function generateRequestId(): string {
  return randomUUID()
}

export function getRequestId(): string | undefined {
  return requestIdStore.getStore()
}

export async function withRequestId<T>(requestId: string, fn: () => Promise<T>): Promise<T> {
  return requestIdStore.run(requestId, fn)
}
