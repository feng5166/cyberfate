/**
 * GET /api/music-oracle/share/[recordId]
 * 获取分享卡片数据（用于 OG 图片生成 + 分享页）
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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

    const record = await prisma.musicOracleRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: '记录不存在' },
        { status: 404 }
      );
    }

    // 更新分享计数（异步，不阻塞响应）
    prisma.musicOracleRecord.update({
      where: { id: recordId },
      data: { shareCount: { increment: 1 } },
    }).catch((err) => console.warn('[music-oracle/share] increment failed:', err));

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
        // 隐私(T10):不外泄用户原始提问。分享卡片/OG 图均不展示 question,
        // 唯一消费者是 OG 图路由且不使用它;若前端分享页将来需回显,应改为登录态私有接口。
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
