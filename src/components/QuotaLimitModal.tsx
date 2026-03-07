'use client';

import { useRouter } from 'next/navigation';

interface QuotaLimitModalProps {
  onClose: () => void;
}

export function QuotaLimitModal({ onClose }: QuotaLimitModalProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-cyber-card border border-cyber-gold/30 rounded-2xl p-8 max-w-sm w-full shadow-glow text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          ✕
        </button>

        <div className="text-4xl mb-3">⏳</div>
        <h3 className="font-heading text-xl font-bold text-cyber-gold mb-2">
          今日免费次数已用完
        </h3>
        <p className="text-text-secondary text-sm mb-6">
          免费用户每天可使用 1 次 AI 解读。<br />
          升级 VIP 享受无限次数解读，以及更多专属功能。
        </p>

        <button
          onClick={() => {
            onClose();
            router.push('/pricing');
          }}
          className="w-full bg-gradient-to-r from-cyber-gold-dark to-cyber-gold text-cyber-bg font-semibold py-3 rounded-lg hover:shadow-glow transition-all duration-200 mb-3"
        >
          升级 VIP
        </button>

        <button
          onClick={onClose}
          className="w-full text-text-muted text-sm py-2 hover:text-text-secondary transition-colors"
        >
          明天再来
        </button>
      </div>
    </div>
  );
}
