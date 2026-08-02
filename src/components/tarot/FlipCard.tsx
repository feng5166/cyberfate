'use client';

import { cn } from '@/lib/utils/cn';

/**
 * 塔罗翻牌（PRD-TAROT-V2 P0-A）：牌背 → 点击 3D 翻转显示牌面。
 * 「自己翻开的牌」产生心理所有权——仪式感的核心交互。
 * 尊重 prefers-reduced-motion（翻转过渡自动关停）。
 */

export interface FlipCardData {
  name_zh: string;
  orientation: 'upright' | 'reversed';
  image_url: string;
}

interface FlipCardProps {
  card: FlipCardData;
  flipped: boolean;
  onFlip: () => void;
  /** 牌位名（过去/现在/未来…） */
  positionLabel?: string;
  /** 牌面宽度 px */
  width: number;
  /** 凯尔特等小卡场景字号收紧 */
  compact?: boolean;
}

export function FlipCard({ card, flipped, onFlip, positionLabel, width, compact }: FlipCardProps) {
  return (
    <div className="text-center">
      {positionLabel && (
        <p className="mb-2 text-xs tracking-[0.16em] text-[#1C1A16]/55">{positionLabel}</p>
      )}
      <div className="mx-auto" style={{ width, maxWidth: '100%' }}>
        <button
          type="button"
          onClick={onFlip}
          disabled={flipped}
          aria-label={flipped ? `${card.name_zh}（${card.orientation === 'upright' ? '正位' : '逆位'}）` : `翻开${positionLabel ?? '这张牌'}`}
          className={cn(
            'block w-full [perspective:800px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4338CA]/50 rounded-[0.85rem]',
            !flipped && 'cursor-pointer',
          )}
          style={{ aspectRatio: '2 / 3' }}
        >
          <div
            className={cn(
              'relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none',
              flipped && '[transform:rotateY(180deg)]',
            )}
          >
            {/* 牌背 */}
            <div className="absolute inset-0 overflow-hidden rounded-[0.85rem] border border-[#1C1A16]/12 [backface-visibility:hidden]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/tarot/card-back.svg"
                alt=""
                aria-hidden
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
              />
            </div>
            {/* 牌面 */}
            <div className="absolute inset-0 overflow-hidden rounded-[0.85rem] border border-[#1C1A16]/12 bg-[#FAF9F6] [transform:rotateY(180deg)] [backface-visibility:hidden]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.image_url}
                alt={card.name_zh}
                className="h-full w-full object-cover"
                style={{ transform: card.orientation === 'reversed' ? 'rotate(180deg)' : undefined }}
              />
            </div>
          </div>
        </button>
      </div>
      {/* 牌名 + 正逆位：翻开后淡入 */}
      <div
        className={cn(
          'transition-opacity duration-300 motion-reduce:transition-none',
          flipped ? 'opacity-100' : 'opacity-0 select-none',
        )}
        aria-hidden={!flipped}
      >
        <h4 className={cn('mt-2 font-medium text-[#1C1A16]', compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm')}>
          {flipped ? card.name_zh : '　'}
        </h4>
        <span
          className={cn(
            'mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px]',
            card.orientation === 'upright' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-[#1C1A16]',
          )}
        >
          {card.orientation === 'upright' ? '正位' : '逆位'}
        </span>
      </div>
    </div>
  );
}
