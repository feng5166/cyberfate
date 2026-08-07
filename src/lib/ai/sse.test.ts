import { describe, it, expect } from 'vitest';
import { typewriterStream } from './sse';

/** 把流完整读出并按 SSE 帧解析，返回 { metaFrame, contentPieces, doneSeen } */
async function drainStream(stream: ReadableStream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let raw = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    raw += decoder.decode(value as Uint8Array, { stream: true });
  }
  const frames = raw
    .split('\n\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^data: /, ''));

  const doneSeen = frames[frames.length - 1] === '[DONE]';
  const jsonFrames = frames.slice(0, -1).map((f) => JSON.parse(f));
  const metaFrame = jsonFrames[0];
  const contentPieces = jsonFrames
    .slice(1)
    .map((f) => f.content as string);
  return { metaFrame, contentPieces, doneSeen };
}

describe('typewriterStream 帧协议', () => {
  it('先 meta 帧、正文分块可完整拼回、末尾 [DONE]', async () => {
    const meta = { kind: 'test', id: 1 };
    const narrative = '天行健，君子以自强不息。地势坤，君子以厚德载物。';
    const { metaFrame, contentPieces, doneSeen } = await drainStream(
      typewriterStream(meta, narrative, { delayMs: 1 }),
    );
    expect(metaFrame).toEqual({ meta });
    expect(contentPieces.join('')).toBe(narrative);
    expect(doneSeen).toBe(true);
  });

  it('长正文分块数不超过 maxChunks 默认上限（64），控制前端 setState 频率与动画总时长', async () => {
    const narrative = '命'.repeat(10_000);
    const { contentPieces } = await drainStream(
      typewriterStream({ ok: true }, narrative, { delayMs: 1 }),
    );
    expect(contentPieces.length).toBeLessThanOrEqual(64);
    expect(contentPieces.join('')).toBe(narrative);
  });

  it('短正文最小块 4 字符，不会退化成逐字帧', async () => {
    const narrative = '子丑寅卯辰巳午未';
    const { contentPieces } = await drainStream(
      typewriterStream(null, narrative, { delayMs: 1 }),
    );
    for (const piece of contentPieces.slice(0, -1)) {
      expect(piece.length).toBeGreaterThanOrEqual(4);
    }
    expect(contentPieces.join('')).toBe(narrative);
  });

  // 降频（18ms→45ms）不得连带把短正文的吐字速度降下来：最小块按间隔等比放大到 10 字。
  it('默认节奏下短正文最小块随间隔等比放大，吐字速率与旧版一致', async () => {
    const narrative = '甲乙丙丁戊己庚辛壬癸'.repeat(6); // 60 字，未达 maxChunks 分块阈值
    const { contentPieces } = await drainStream(typewriterStream(null, narrative));
    for (const piece of contentPieces.slice(0, -1)) {
      expect(piece.length).toBeGreaterThanOrEqual(10);
    }
    expect(contentPieces.length).toBeLessThanOrEqual(6);
    expect(contentPieces.join('')).toBe(narrative);
  });
});
