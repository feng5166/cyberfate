// 命理模块通用的「打字机式 SSE 流」。
// 帧协议（前端按此消费）：先一帧 { meta }，再把正文分块发 { content }，最后 data: [DONE]。
// 原先 tarot/meihua/liuyao/music-oracle 各存一份，且只有 tarot 做了分块封顶——
// 这里统一为封顶版，避免长文按固定 chunk 把 Serverless 函数占住十几秒。

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
} as const;

export interface TypewriterOptions {
  /** 分块总数上限；正文越长 chunk 越大，保证动画总时长有界（默认 160，约 ≤3s） */
  maxChunks?: number;
  /** 每块间隔毫秒（默认 18） */
  delayMs?: number;
}

export function typewriterStream(
  meta: unknown,
  narrative: string,
  opts: TypewriterOptions = {},
): ReadableStream {
  const encoder = new TextEncoder();
  const maxChunks = opts.maxChunks ?? 160;
  const delayMs = opts.delayMs ?? 18;
  const chunkSize = Math.max(4, Math.ceil(narrative.length / maxChunks));

  return new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ meta })}\n\n`));
      for (let i = 0; i < narrative.length; i += chunkSize) {
        const piece = narrative.slice(i, i + chunkSize);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: piece })}\n\n`));
        await new Promise((r) => setTimeout(r, delayMs));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}
