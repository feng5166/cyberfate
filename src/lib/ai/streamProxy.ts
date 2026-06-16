// 流式代理工具：客户端断连时立即 abort 上游 fetch + cancel reader，避免烧 token。

export interface StreamProxyHandle {
  signal: AbortSignal;
  /** 注册到 ReadableStream（在 start 末尾或 finally 调用） */
  release: () => void;
  /** 在 cancel 中调用：abort 上游、cancel reader、移除监听 */
  cancel: (reader?: ReadableStreamDefaultReader<unknown> | null) => Promise<void>;
}

export function attachClientAbort(req: Request | { signal: AbortSignal }): StreamProxyHandle {
  const ac = new AbortController();
  const clientSignal = req.signal;
  const onAbort = () => ac.abort();

  if (clientSignal.aborted) {
    ac.abort();
  } else {
    clientSignal.addEventListener('abort', onAbort, { once: true });
  }

  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    clientSignal.removeEventListener('abort', onAbort);
  };

  return {
    signal: ac.signal,
    release,
    cancel: async (reader) => {
      ac.abort();
      if (reader) {
        try { await reader.cancel(); } catch {}
      }
      release();
    },
  };
}
