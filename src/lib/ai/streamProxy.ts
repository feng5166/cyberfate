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
export interface ProxyLLMOptions {
  /** 流正常读完后回调，收到拼接好的完整答案 + 是否被客户端中断 + 是否被 max_tokens 截断（用于写历史/缓存等，截断的答案不应长期缓存）。抛错会被吞，不影响出流。 */
  onComplete?: (fullText: string, aborted: boolean, truncated?: boolean) => void | Promise<void>;
  /** 日志标识（如路由名），用于截断告警定位来源。 */
  label?: string;
  /** 自定义每个 content 帧的对象形状（默认 `{ content }`；如需 `{ type:'content', content }` 在此覆盖）。 */
  contentFrame?: (content: string) => object;
  /** delta 流开始前先发的帧序列（可带 delayMs 节奏，用于工具链「推算中」动画等）。 */
  prefixFrames?: Array<{ frame: object; delayMs?: number }>;
}

export function proxyLLMDeltaStream(
  upstream: Response,
  handle: StreamProxyHandle,
  opts: ProxyLLMOptions = {},
): ReadableStream {
  const reader = upstream.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const encodeSse = (data: object | string): Uint8Array =>
    encoder.encode(`data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);
  const makeContentFrame = opts.contentFrame ?? ((content: string) => ({ content }));

  return new ReadableStream({
    async start(controller) {
      // 前置帧（如工具链步骤动画）
      for (const p of opts.prefixFrames ?? []) {
        if (handle.signal.aborted) break;
        controller.enqueue(encodeSse(p.frame));
        if (p.delayMs) await new Promise((r) => setTimeout(r, p.delayMs));
      }

      let buffer = '';
      let fullText = '';
      let truncated = false;
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
                fullText += delta;
                controller.enqueue(encodeSse(makeContentFrame(delta)));
              }
              if (json.choices?.[0]?.finish_reason === 'length') truncated = true;
            } catch { /* 单行 JSON 不完整则跳过 */ }
          }
        }
        if (truncated) {
          console.warn(`[proxyLLMDeltaStream${opts.label ? `:${opts.label}` : ''}] 回复被 max_tokens 截断（已输出 ${fullText.length} 字），需上调该路由的 max_tokens`);
        }
        if (opts.onComplete) {
          try { await opts.onComplete(fullText, handle.signal.aborted, truncated); } catch (e) { console.error('[proxyLLMDeltaStream] onComplete failed:', e); }
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
