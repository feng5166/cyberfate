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
  /** 分块总数上限；正文越长 chunk 越大，保证动画总时长有界（默认 64，约 ≤3s） */
  maxChunks?: number;
  /** 每块间隔毫秒（默认 45） */
  delayMs?: number;
}

export function typewriterStream(
  meta: unknown,
  narrative: string,
  opts: TypewriterOptions = {},
): ReadableStream {
  const encoder = new TextEncoder();
  // 节奏参数：45ms × 64 块 ≈ 2.9s，总时长与旧版（18ms × 160）一致、字符吐出速率不变。
  // 但事件频率从 ~55/s 降到 ~22/s——前端每收一个 content 帧就 setState 一次，
  // 高频小块会把低端机主线程打满；加大块、降频率视觉等效，渲染压力减半以上。
  const maxChunks = opts.maxChunks ?? 64;
  const delayMs = opts.delayMs ?? 45;
  // 最小块随间隔等比放大（旧版基准 4 字 / 18ms ≈ 0.22 字/ms），并保底 4 字不退化成逐字帧。
  // 否则短正文（<640 字，chunkSize 会被最小值兜住）在 45ms 间隔下只吐 4 字，
  // 打字速度只剩旧版四成、动画凭空拖长 2.5 倍——降频只该减少事件数，不该改吐字节奏。
  const minChunk = Math.max(4, Math.round((delayMs * 4) / 18));
  const chunkSize = Math.max(minChunk, Math.ceil(narrative.length / maxChunks));

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
