'use client';

import { useRouter } from 'next/navigation';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface QuotaLimitModalProps {
  onClose: () => void;
}

export function QuotaLimitModal({ onClose }: QuotaLimitModalProps) {
  const router = useRouter();
  const focusTrapRef = useFocusTrap(true);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div ref={focusTrapRef} role="dialog" aria-modal="true" aria-label="今日免费次数已用完" className="relative bg-white border border-brand-border rounded-2xl p-8 max-w-sm w-full shadow-pricing text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-primary transition-colors"
        >
          ✕
        </button>

        <div className="text-4xl mb-3">⏳</div>
        <h3 className="font-heading text-xl font-bold text-primary mb-2">
          今日免费次数已用完
        </h3>
        <p className="text-secondary text-sm mb-2">
          免费用户每天可使用 1 次 AI 解读。<br />
          配额将在次日 <span className="font-medium text-primary">00:00</span> 自动重置。
        </p>
        <p className="text-secondary text-sm mb-6">
          升级会员即可享受 <span className="font-medium text-primary">无限次数</span> 解读及更多专属功能。
        </p>

        <button
          onClick={() => {
            onClose();
            router.push('/pricing');
          }}
          className="w-full bg-brand-accent text-white font-semibold py-3 rounded-lg hover:bg-brand-accent-hover transition-all duration-200 mb-3"
        >
          解锁全部功能
        </button>

        <button
          onClick={() => {
            onClose();
            router.push('/pricing');
          }}
          className="w-full text-[#1C1A16]/60 text-sm py-2 hover:text-[#1C1A16] transition-colors underline"
        >
          了解会员权益 →
        </button>

        <button
          onClick={onClose}
          className="w-full text-muted text-xs py-1.5 hover:text-secondary transition-colors mt-1"
        >
          明天再来
        </button>
      </div>
    </div>
  );
}
