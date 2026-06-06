import { NextResponse } from 'next/server';
import { generateTarotReading } from '@/lib/ai/client';

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

  try {
    const result = await generateTarotReading(input);
    return NextResponse.json({
      source: result._source,
      readingLen: result.reading.length,
      readingPreview: result.reading.slice(0, 100),
      cardMeanings: result.cardMeanings.length,
    });
  } catch (e: unknown) {
    return NextResponse.json({ threw: e instanceof Error ? e.message : String(e) });
  }
}
