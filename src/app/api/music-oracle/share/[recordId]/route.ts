/**
 * GET /api/music-oracle/share/[recordId]
 * 获取分享卡片数据（用于 OG 图片生成 + 分享页）
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const { recordId } = await params;

    if (!recordId) {
      return NextResponse.json(
        { success: false, error: '缺少记录ID' },
        { status: 400 }
      );
    }

    const prisma = new PrismaClient();
    const record = await prisma.musicOracleRecord.findUnique({
      where: { id: recordId },
    });
    await prisma.$disconnect();

    if (!record) {
      return NextResponse.json(
        { success: false, error: '记录不存在' },
        { status: 404 }
      );
    }

    // 更新分享计数（异步，不阻塞响应）
    const prisma2 = new PrismaClient();
    prisma2.musicOracleRecord.update({
      where: { id: recordId },
      data: { shareCount: { increment: 1 } },
    }).then(() => prisma2.$disconnect()).catch(() => prisma2.$disconnect());

    return NextResponse.json({
      success: true,
      data: {
        songName: record.songName,
        artist: record.artist,
        lyricsQuote: record.lyricsQuote,
        oracleText: record.oracleText,
        musicTags: record.musicTags,
        wuxingNote: record.wuxingNote,
        ganzhi: record.ganzhi,
        wuxing: record.wuxing,
        question: record.question,
        createdAt: record.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[music-oracle/share] 错误:', err);
    return NextResponse.json(
      { success: false, error: '服务异常' },
      { status: 500 }
    );
  }
}
