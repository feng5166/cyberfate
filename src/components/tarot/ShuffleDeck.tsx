'use client';

/**
 * 洗牌动画（PRD-TAROT-V2 P0-A）：牌堆交叠洗切，约 1.6s 一轮循环。
 * prefers-reduced-motion 下由父级直接跳过本阶段；此处动画也自动关停。
 */
export function ShuffleDeck() {
  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <div className="relative h-[180px] w-[220px]" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-[150px] w-[100px] overflow-hidden rounded-[0.7rem] border border-[#1C1A16]/15 shadow-sm motion-reduce:!animate-none"
            style={{
              animation: `tarotShuffle${i % 3} 1.6s ease-in-out ${i * 0.12}s infinite`,
              zIndex: i,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/tarot/card-back.svg" alt="" className="h-full w-full object-cover" />
          </div>
        ))}
        <style>{`
          @keyframes tarotShuffle0 {
            0%, 100% { transform: translate(-50%, -50%) rotate(-4deg); }
            50% { transform: translate(calc(-50% - 46px), -50%) rotate(-12deg); }
          }
          @keyframes tarotShuffle1 {
            0%, 100% { transform: translate(-50%, -50%) rotate(3deg); }
            50% { transform: translate(calc(-50% + 46px), calc(-50% - 8px)) rotate(12deg); }
          }
          @keyframes tarotShuffle2 {
            0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
            50% { transform: translate(-50%, calc(-50% - 22px)) rotate(5deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            [style*="tarotShuffle"] { animation: none !important; }
          }
        `}</style>
      </div>
      <p className="text-sm tracking-[0.12em] text-[#1C1A16]/55">正在为你洗牌…请在心中默念你的问题</p>
    </div>
  );
}
