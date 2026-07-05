/**
 * GET /api/og/music-oracle/[recordId]
 * Vercel OG 分享图生成
 * 750×1100px 竖版卡片（适配小红书/朋友圈）
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const WUXING_COLORS: Record<string, { bg: string; accent: string }> = {
  木: { bg: '#ecfdf5', accent: '#059669' },
  火: { bg: '#fff7ed', accent: '#DC2626' },
  土: { bg: '#fefce8', accent: '#D97706' },
  金: { bg: '#f9fafb', accent: '#6B7280' },
  水: { bg: '#eff6ff', accent: '#2563EB' },
};

const WUXING_ICONS: Record<string, string> = {
  木: '🌿', 火: '🔥', 土: '🏔', 金: '✨', 水: '💧',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const { recordId } = await params;

    // 通过内部 API 获取记录数据（edge runtime 不能直接用 Prisma）
    // Vercel 上 VERCEL_URL 恒为当前部署域名(优先,保证同部署内取数);
    // 非 Vercel 用 NEXTAUTH_URL(含协议);本地兜底 localhost。
    // 旧写法 `(NEXTAUTH_URL || VERCEL_URL) ? https://${VERCEL_URL} : ...` 有优先级 bug,
    // NEXTAUTH_URL 有值但 VERCEL_URL 无值时会得到 https://undefined。
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXTAUTH_URL || 'http://localhost:3000');
    const shareRes = await fetch(`${baseUrl}/api/music-oracle/share/${recordId}`);
    const shareJson = await shareRes.json();

    if (!shareJson.success) {
      return new Response('Record not found', { status: 404 });
    }

    const record = shareJson.data;

    const colors = WUXING_COLORS[record.wuxing] || WUXING_COLORS['木'];
    const icon = WUXING_ICONS[record.wuxing] || '🌿';
    const tags = Array.isArray(record.musicTags)
      ? (record.musicTags as string[]).join(' · ')
      : '';

    // 截断签文（分享图最多4行）
    const oracleLines = record.oracleText.replace(/\n/g, ' ').substring(0, 160);

    return new ImageResponse(
      (
        <div
          style={{
            width: '750px',
            height: '1100px',
            background: '#FAF9F6',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* 顶部品牌 */}
          <div
            style={{
              fontSize: '13px',
              color: '#9CA3AF',
              letterSpacing: '0.15em',
              marginBottom: '40px',
            }}
          >
            CYBERFATE · 音乐运势签
          </div>

          {/* 封面占位 */}
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${colors.bg}, ${colors.accent}22)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '80px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            {icon}
          </div>

          {/* 歌名 */}
          <div
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#1C1A16',
              marginTop: '28px',
            }}
          >
            《{record.songName}》
          </div>

          {/* 歌手·风格 */}
          <div
            style={{
              fontSize: '14px',
              color: '#9CA3AF',
              marginTop: '6px',
            }}
          >
            {record.artist}{tags ? ` · ${tags}` : ''}
          </div>

          {/* 歌词金句 */}
          <div
            style={{
              fontSize: '16px',
              fontStyle: 'italic',
              color: '#4B5563',
              margin: '24px 40px',
              textAlign: 'center',
              lineHeight: 1.8,
            }}
          >
            ❝ {record.lyricsQuote} ❞
          </div>

          {/* 分割线 */}
          <div
            style={{
              width: '670px',
              height: '1px',
              background: '#E5E0D8',
              margin: '10px 0',
            }}
          />

          {/* 命运签文标签 */}
          <div
            style={{
              fontSize: '11px',
              color: '#9CA3AF',
              letterSpacing: '0.2em',
              margin: '10px 0 16px',
            }}
          >
            命运签文
          </div>

          {/* 签文正文 */}
          <div
            style={{
              fontSize: '15px',
              color: '#1C1A16',
              lineHeight: 1.9,
              margin: '0 40px',
              textAlign: 'center',
              maxHeight: '180px',
              overflow: 'hidden',
            }}
          >
            {oracleLines}
          </div>

          {/* 五行信息条 */}
          <div
            style={{
              background: '#F5F2ED',
              borderRadius: '12px',
              margin: '24px 40px',
              padding: '12px 24px',
              fontSize: '12px',
              color: '#6B7280',
              display: 'flex',
              gap: '24px',
            }}
          >
            <span>今日天干：{record.ganzhi}</span>
            <span>{record.wuxingNote || `五行属${record.wuxing}`}</span>
          </div>

          {/* 底部品牌 */}
          <div
            style={{
              fontSize: '12px',
              color: '#C8C3BC',
              marginTop: 'auto',
              marginBottom: '32px',
            }}
          >
            cyberfate.me/music-oracle
          </div>
        </div>
      ),
      {
        width: 750,
        height: 1100,
      }
    );
  } catch (err) {
    console.error('[og/music-oracle] 错误:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
