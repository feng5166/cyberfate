'use client';

import { useEffect, useState } from 'react';

// AI 解读常需 20s+，固定文案会让用户以为卡死；阶段文案轮播提供「仍在推进」的感知。
// 文案保持模块中性（塔罗/六爻/梅花/八字共用）且诚实：不承诺「马上好」。
const DEFAULT_STAGES = [
  '命理师正在解读...',
  '正在梳理盘面与线索…',
  '命理师在斟酌用词…',
  '长解读需要一点时间，值得等…',
  '正在整理成文，请再稍候…',
];

// 每条文案停留 7s：与主链路 20-110s 的实际耗时匹配，轮完一圈约 35s。
const STAGE_INTERVAL_MS = 7000;
const FADE_MS = 300;

interface OracleLoadingProps {
  /** 自定义阶段文案；不传用默认命理文案（零 props 调用完全兼容） */
  stages?: string[];
  /** 预计耗时（秒），传入时在文案旁显示「预计约 N 秒」管理预期 */
  expectSeconds?: number;
}

export function OracleLoading({ stages, expectSeconds }: OracleLoadingProps = {}) {
  const list = stages && stages.length > 0 ? stages : DEFAULT_STAGES;
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (list.length <= 1) return;
    let fadeTimer: number | undefined;
    const interval = window.setInterval(() => {
      // 尊重系统「减少动态效果」：直接换文案，不做淡入淡出
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setIndex((i) => i + 1);
        return;
      }
      setFading(true);
      fadeTimer = window.setTimeout(() => {
        setIndex((i) => i + 1);
        setFading(false);
      }, FADE_MS);
    }, STAGE_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      if (fadeTimer !== undefined) window.clearTimeout(fadeTimer);
    };
  }, [list.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 px-4 py-3 bg-[#F6F4F1] rounded-full text-sm text-[#1C1A16]/70 w-fit"
    >
      <svg
        className="animate-spin motion-reduce:animate-none w-4 h-4 shrink-0 text-[#1C1A16]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        />
      </svg>
      <span
        className={`transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}
      >
        {list[index % list.length]}
      </span>
      {expectSeconds != null && expectSeconds > 0 && (
        <span className="text-xs text-[#1C1A16]/45 whitespace-nowrap">
          预计约 {expectSeconds} 秒
        </span>
      )}
    </div>
  );
}
