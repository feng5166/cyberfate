import { describe, it, expect, vi } from 'vitest';
import { proxyLLMDeltaStream, type StreamProxyHandle } from './streamProxy';

function upstreamFrom(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return new Response(body);
}

async function collect(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value as Uint8Array, { stream: true });
  }
  return out;
}

function fakeHandle(): StreamProxyHandle & { release: ReturnType<typeof vi.fn> } {
  return {
    signal: new AbortController().signal,
    release: vi.fn(),
    cancel: vi.fn(async () => {}),
  };
}

describe('proxyLLMDeltaStream', () => {
  it('把上游 delta 转成 {content} 帧 + 末尾 [DONE]，并用完整答案回调 onComplete', async () => {
    const upstream = upstreamFrom([
      'data: {"choices":[{"delta":{"content":"你"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"好"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);
    const handle = fakeHandle();
    const onComplete = vi.fn();
    const out = await collect(proxyLLMDeltaStream(upstream, handle, { onComplete }));

    expect(out).toContain('data: {"content":"你"}\n\n');
    expect(out).toContain('data: {"content":"好"}\n\n');
    expect(out.trim().endsWith('data: [DONE]')).toBe(true);
    expect(onComplete).toHaveBeenCalledWith('你好', false); // 完整答案 + 未中断
    expect(handle.release).toHaveBeenCalled();
  });

  it('contentFrame 可自定义帧形状（如 {type:"content"}）', async () => {
    const upstream = upstreamFrom(['data: {"choices":[{"delta":{"content":"x"}}]}\n\n', 'data: [DONE]\n\n']);
    const out = await collect(
      proxyLLMDeltaStream(upstream, fakeHandle(), { contentFrame: (content) => ({ type: 'content', content }) }),
    );
    expect(out).toContain('data: {"type":"content","content":"x"}\n\n');
  });

  it('prefixFrames 在 delta 之前先发（工具链动画）', async () => {
    const upstream = upstreamFrom(['data: {"choices":[{"delta":{"content":"a"}}]}\n\n', 'data: [DONE]\n\n']);
    const out = await collect(
      proxyLLMDeltaStream(upstream, fakeHandle(), {
        prefixFrames: [{ frame: { type: 'step', name: 's1' } }],
      }),
    );
    const stepIdx = out.indexOf('"type":"step"');
    const contentIdx = out.indexOf('"content":"a"');
    expect(stepIdx).toBeGreaterThanOrEqual(0);
    expect(stepIdx).toBeLessThan(contentIdx); // 前置帧在内容帧之前
  });

  it('跳过空 delta / 非 data 行 / 坏 JSON；始终以 [DONE] 结尾', async () => {
    const upstream = upstreamFrom([
      'data: {"choices":[{"delta":{}}]}\n\n',
      'garbage line\n\n',
      'data: not-json\n\n',
      'data: {"choices":[{"delta":{"content":"x"}}]}\n\n',
    ]);
    const out = await collect(proxyLLMDeltaStream(upstream, fakeHandle()));

    expect(out).toContain('data: {"content":"x"}\n\n');
    expect(out).toContain('data: [DONE]');
    expect((out.match(/"content"/g) || []).length).toBe(1); // 仅一帧内容
  });

  it('正确处理跨 chunk 边界切断的一行', async () => {
    const upstream = upstreamFrom([
      'data: {"choices":[{"delta":{"con',
      'tent":"ab"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);
    const out = await collect(proxyLLMDeltaStream(upstream, fakeHandle()));
    expect(out).toContain('data: {"content":"ab"}\n\n');
  });
});
