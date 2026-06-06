import { NextResponse } from 'next/server';
import { generateTarotReading } from '@/lib/ai/client';
import { withAiTimeout } from '@/lib/ai/withTimeout';
import { withCircuitBreaker } from '@/lib/ai/circuitBreaker';

export async function GET() {
  const input = {
    spread: 'three' as const,
    spreadName: '经典三张牌',
    question: '测试',
    cards: [
      { position: '过去', name: '愚者', orientation: 'upright' as const, keywords: ['自由'], traditionalMeaning: '新的开始' },
      { position: '现在', name: '魔术师', orientation: 'upright' as const, keywords: ['意志'], traditionalMeaning: '主动创造' },
      { position: '未来', name: '女祭司', orientation: 'upright' as const, keywords: ['直觉'], traditionalMeaning: '内在智慧' },
    ],
  };

  // 方式1: 直接调
  const direct = await generateTarotReading(input);

  // 方式2: 完整走 withCircuitBreaker + withAiTimeout（和 draw route 完全一样）
  let wrapped: Awaited<ReturnType<typeof generateTarotReading>> | { _source: string; error: string };
  try {
    wrapped = await withCircuitBreaker('deepseek-tarot-diag', () =>
      withAiTimeout(() => generateTarotReading(input), 110_000)
    );
  } catch (e: unknown) {
    wrapped = { _source: 'threw', error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }

  return NextResponse.json({
    direct_source: direct._source,
    direct_readingLen: direct.reading.length,
    wrapped_source: wrapped._source,
    wrapped_readingLen: '_source' in wrapped && wrapped._source !== 'threw' ? (wrapped as typeof direct).reading?.length : 0,
    wrapped_error: 'error' in wrapped ? (wrapped as {error:string}).error : null,
  });
}
