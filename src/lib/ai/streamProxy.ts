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

/**
 * 把上游 OpenAI 兼容的流式响应转成给前端的 SSE：逐块解析 `data: {choices[0].delta.content}`，
 * 只把非空 content 以 `{ content }` 帧回吐，末尾发 `[DONE]`；读流出错发一帧 `{ error }`。
 * 客户端断连时 cancel 上游。原先各 QA 路由（meihua/qa、liuyao/qa …）各存一份，这里统一。
 */
export function proxyLLMDeltaStream(upstream: Response, handle: StreamProxyHandle): ReadableStream {
  const reader = upstream.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const encodeSse = (data: object | string): Uint8Array =>
    encoder.encode(`data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);

  return new ReadableStream({
    async start(controller) {
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const ln of lines) {
            const t = ln.trim();
            if (!t || !t.startsWith('data:')) continue;
            const d = t.slice(5).trim();
            if (d === '[DONE]') continue;
            try {
              const json = JSON.parse(d);
              const delta = json.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta.length > 0) {
                controller.enqueue(encodeSse({ content: delta }));
              }
            } catch { /* 单行 JSON 不完整则跳过 */ }
          }
        }
      } catch (err) {
        controller.enqueue(encodeSse({ error: err instanceof Error ? err.message : String(err) }));
      } finally {
        controller.enqueue(encodeSse('[DONE]'));
        handle.release();
        controller.close();
      }
    },
    async cancel() {
      await handle.cancel(reader);
    },
  });
}
