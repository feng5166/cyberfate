'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface CardDrawAnimationProps {
  cardCount: number;
  onComplete: (selectedIndices: number[]) => void;
}

export function CardDrawAnimation({ cardCount, onComplete }: CardDrawAnimationProps) {
  const [shuffling, setShuffling] = useState(true);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const totalCards = 78;

  useEffect(() => {
    // 洗牌动画持续 2 秒
    const timer = setTimeout(() => {
      setShuffling(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleCardClick = (index: number) => {
    if (shuffling || selectedCards.includes(index)) return;
    
    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === cardCount) {
      // 翻牌动画后完成
      setTimeout(() => {
        onComplete(newSelected);
      }, 800);
    }
  };

  return (
    <div className="space-y-6">
      {shuffling && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin text-4xl mb-4">✦</div>
          <p className="text-primary">正在洗牌...</p>
        </div>
      )}

      {!shuffling && (
        <div className="text-center mb-4">
          <p className="text-secondary">
            请选择 {cardCount} 张牌 ({selectedCards.length}/{cardCount})
          </p>
        </div>
      )}

      <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
        {Array.from({ length: shuffling ? 20 : totalCards }).map((_, i) => (
          <div
            key={i}
            onClick={() => handleCardClick(i)}
            className={`
              aspect-[2/3] rounded cursor-pointer transition-all duration-300
              ${shuffling ? 'animate-pulse' : ''}
              ${selectedCards.includes(i) ? 'scale-110 ring-2 ring-primary' : 'hover:scale-105'}
              ${!shuffling && !selectedCards.includes(i) ? 'hover:shadow-lg' : ''}
            `}
            style={{
              background: selectedCards.includes(i) 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
            }}
          >
            <div className="w-full h-full flex items-center justify-center text-white text-2xl">
              {selectedCards.includes(i) ? '✨' : '🃏'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
