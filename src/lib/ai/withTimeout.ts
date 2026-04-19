export class AiTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`AI request timed out after ${timeoutMs}ms`);
    this.name = 'AiTimeoutError';
  }
}

export async function withAiTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  fallback?: () => Promise<T> | T,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await fn(controller.signal);
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    if (controller.signal.aborted) {
      if (fallback) return fallback();
      throw new AiTimeoutError(timeoutMs);
    }
    throw err;
  }
}
