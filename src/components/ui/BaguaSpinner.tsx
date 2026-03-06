'use client';

export function BaguaSpinner({ size = 48 }: { size?: number }) {
  return (
    <div 
      className="animate-spin"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* 外圈 */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="#ffd700" strokeWidth="2" opacity="0.3"/>
        
        {/* 阴阳鱼 */}
        <path
          d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2"
          fill="#ffd700"
        />
        <path
          d="M50 98 A48 48 0 0 1 50 2 A24 24 0 0 1 50 50 A24 24 0 0 0 50 98"
          fill="#1a1a2e"
        />
        
        {/* 阴阳鱼眼 */}
        <circle cx="50" cy="26" r="6" fill="#1a1a2e"/>
        <circle cx="50" cy="74" r="6" fill="#ffd700"/>
      </svg>
    </div>
  );
}
