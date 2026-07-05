/**
 * GET /api/daily-music
 * 获取今日运势页"今日之歌"卡片数据
 * 
 * Query params:
 *   ?refresh=true  — 换一首（从 alternates 选）
 *   &index=0|1|2   — 指定使用哪首（0=主推荐，1/2=备选）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/cache/redis';
import { generateDailyMusic, type DailyMusicResult } from '@/lib/music-oracle/generate';
import { getTodayTiangan, getWuxingMusicProfile } from '@/lib/music-oracle/wuxing-music-map';
import { getTodayBeijing, getSecondsUntilBeijingMidnight } from '@/lib/timezone';

interface CachedData extends DailyMusicResult {
  /** 当前展示的索引：0=main, 1/2=alternates[0]/[1] */
  currentIndex: number;
}

function getTodayDateStr(): string {
  return getTodayBeijing();
}

function getSecondsUntilMidnight(): number {
  // 缓存键按北京日滚动(getTodayDateStr),TTL 也必须对齐北京午夜,
  // 否则走 UTC 午夜=北京 08:00 提前失效、当天重复生成 + 丢「换一首」轮换状态。
  return getSecondsUntilBeijingMidnight();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    const indexParam = searchParams.get('index');

    const dateStr = getTodayDateStr();
    const cacheKey = `daily-music:${dateStr}`;
    const redis = getRedis();

    let cached: CachedData | null = null;

    // 1. 尝试读 Redis 缓存
    if (redis) {
      try {
        const raw = await redis.get(cacheKey);
        if (raw) {
          cached = typeof raw === 'string' ? JSON.parse(raw) : raw as CachedData;
        }
      } catch (err) {
        console.warn('[daily-music] Redis 读取失败:', err);
      }
    }

    // 2. 处理"换一首"逻辑
    if (cached && refresh) {
      const totalCount = 1 + (cached.alternates?.length || 0);
      let newIndex = (cached.currentIndex || 0) + 1;

      if (indexParam !== null) {
        const parsed = parseInt(indexParam, 10);
        if (parsed >= 0 && parsed < totalCount) {
          newIndex = parsed;
        }
      }

      if (newIndex < totalCount) {
        cached.currentIndex = newIndex;
        // 更新缓存中的 currentIndex
        if (redis) {
          try {
            const ttl = getSecondsUntilMidnight();
            await redis.set(cacheKey, JSON.stringify(cached), { ex: ttl });
          } catch (err) {
            console.warn('[daily-music] Redis 更新 currentIndex 失败:', err);
          }
        }
      }
      // 如果已经没有更多备选，保持当前
    }

    // 3. 缓存 miss，调 AI 生成
    if (!cached) {
      const result = await generateDailyMusic();
      if (!result) {
        return NextResponse.json(
          { success: false, error: '今日之歌生成失败，请稍后重试', code: 'AI_ERROR' },
          { status: 500 }
        );
      }

      cached = { ...result, currentIndex: 0 };

      // 写入 Redis
      if (redis) {
        try {
          const ttl = getSecondsUntilMidnight();
          await redis.set(cacheKey, JSON.stringify(cached), { ex: ttl });
        } catch (err) {
          console.warn('[daily-music] Redis 写入失败:', err);
        }
      }
    }

    // 4. 根据 currentIndex 选取要展示的歌曲
    const currentIdx = cached.currentIndex || 0;
    const allSongs = [cached.main, ...(cached.alternates || [])];
    const song = allSongs[currentIdx] || cached.main;
    const totalCount = allSongs.length;
    const canRefresh = currentIdx < totalCount - 1;

    // 5. 获取五行信息
    const todayInfo = getTodayTiangan();
    const profile = getWuxingMusicProfile(todayInfo.tiangan);

    return NextResponse.json({
      success: true,
      data: {
        songName: song.songName,
        artist: song.artist,
        lyricsQuote: song.lyricsQuote,
        oracleSummary: song.oracleSummary,
        oracleFullText: song.oracleText,
        musicTags: song.musicTags,
        todayGanzhi: cached.ganzhi,
        wuxing: cached.wuxing,
        wuxingNote: song.wuxingNote,
        canRefresh,
        currentIndex: currentIdx,
      },
    });
  } catch (err: any) {
    console.error('[daily-music] 未知错误:', err);
    return NextResponse.json(
      { success: false, error: '服务异常，请稍后重试', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
