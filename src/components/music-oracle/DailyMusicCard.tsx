'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, RefreshCw, ChevronRight, Music } from 'lucide-react';
import Link from 'next/link';
import { wuxingColor } from '@/data/wuxing';

/** 五行封面：图标为装饰 emoji，底色统一取自 @/data/wuxing 单一真源 */
const WUXING_ICONS: Record<string, string> = {
  木: '🌿', 火: '🔥', 土: '🏔', 金: '✨', 水: '💧',
};

function wuxingCover(cn: string) {
  return { bg: wuxingColor(cn).bg, icon: WUXING_ICONS[cn] || WUXING_ICONS['木'] };
}

interface DailyMusicData {
  songName: string;
  artist: string;
  lyricsQuote: string;
  oracleSummary: string;
  oracleFullText: string;
  musicTags: string[];
  todayGanzhi: string;
  wuxing: string;
  wuxingNote: string;
  canRefresh: boolean;
  currentIndex: number;
}

export default function DailyMusicCard() {
  const [data, setData] = useState<DailyMusicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(false);

      const params = new URLSearchParams();
      if (refresh && data) {
        params.set('refresh', 'true');
        params.set('index', String((data.currentIndex || 0) + 1));
      }

      const url = `/api/daily-music${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [data]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      // 截图库按需加载：只在点击分享时才进 bundle，不拖累引用本卡片的页面首屏
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        backgroundColor: '#FFFFFF',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `今日之歌-${data?.songName || '分享'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('分享截图失败:', err);
    } finally {
      setSharing(false);
    }
  };

  const handleRefresh = () => {
    if (!data?.canRefresh || refreshing) return;
    fetchData(true);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-2xl border border-[#1C1A16]/8 bg-white p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-xl bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-200 rounded mt-2" />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-[#1C1A16]/8 space-y-2">
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-4/5 bg-gray-200 rounded" />
          <div className="h-3 w-3/5 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="rounded-2xl border border-[#1C1A16]/8 bg-white p-5">
        <div className="flex items-center gap-1.5 mb-4">
          <Music className="w-4 h-4" strokeWidth={1.5} style={{ color: '#0E7490' }} />
          <span className="text-sm font-medium font-serif text-[#1C1A16]">今日之歌</span>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-[#9CA3AF] mb-3">今日之歌暂未生成，稍后再来</p>
          <button
            onClick={() => fetchData()}
            className="text-sm font-medium text-[#1C1A16] hover:underline"
          >
            点击重试
          </button>
        </div>
      </div>
    );
  }

  const cover = wuxingCover(data.wuxing);

  return (
    <div
      ref={cardRef}
      className="rounded-2xl border border-[#1C1A16]/8 bg-white p-5"
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#CFFAFE' }}
          >
            <Music className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: '#0E7490' }} />
          </span>
          <span className="text-sm font-medium font-serif text-[#1C1A16]">今日之歌</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-[#1C1A16] transition-colors disabled:opacity-50"
            title="分享"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>分享</span>
          </button>
          {data.canRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-[#1C1A16] transition-colors disabled:opacity-50"
              title="换一首"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>换一首</span>
            </button>
          )}
        </div>
      </div>

      {/* 歌曲信息 */}
      <div className="flex gap-4">
        {/* 封面占位（五行渐变） */}
        <div
          className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ background: cover.bg }}
        >
          <span className="text-3xl">{cover.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-[#1C1A16] truncate">
            《{data.songName}》
          </h3>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">
            {data.artist}
          </p>
          <p className="text-xs italic text-[#9CA3AF] leading-relaxed mt-2">
            &ldquo;{data.lyricsQuote}&rdquo;
          </p>
        </div>
      </div>

      {/* 分割线 */}
      <div className="border-t border-[#1C1A16]/8 my-3" />

      {/* 签文摘要 */}
      <p className="text-[13px] text-[#4B5563] leading-relaxed line-clamp-3">
        {data.oracleSummary}
      </p>

      {/* 查看完整解读 */}
      <Link
        href="/music-oracle"
        className="inline-flex items-center gap-0.5 text-xs text-brand-accent hover:text-brand-accent-hover mt-2 transition-colors"
      >
        查看完整解读
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
