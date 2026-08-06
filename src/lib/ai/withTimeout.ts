export class AiTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`AI request timed out after ${timeoutMs}ms`);
    this.name = 'AiTimeoutError';
  }
}

/**
 * 真超时语义：fn 与定时器 Promise.race，到点立即 reject（或走 fallback），不再等 fn 自己结束。
 * 旧版只是 setTimeout + abort signal，fn 不消费 signal 时超时形同虚设（会一直挂到 Vercel 击杀函数）。
 * 超时的同时 abort controller，尽力取消底层请求（fn 消费 signal 时可提前释放连接/停止烧 token）。
 */
export async function withAiTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  fallback?: () => Promise<T> | T,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new AiTimeoutError(timeoutMs));
    }, timeoutMs);
  });

  try {
    // race 订阅了两个 promise：超时赢了之后 fn 迟到的 rejection 也已被订阅，不会产生 unhandledRejection
    return await Promise.race([fn(controller.signal), timeout]);
  } catch (err) {
    // 超时（race 输出 AiTimeoutError）或 fn 因我们 abort 而失败：有 fallback 走 fallback，否则统一抛超时错
    if (err instanceof AiTimeoutError || controller.signal.aborted) {
      if (fallback) return fallback();
      throw err instanceof AiTimeoutError ? err : new AiTimeoutError(timeoutMs);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
