'use client';

interface PaymentModalProps {
  planName: string;
  price: string;
  onClose: () => void;
}

export function PaymentModal({ planName, price, onClose }: PaymentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* 弹窗 */}
      <div className="relative bg-cyber-card border border-cyber-gold/30 rounded-2xl p-8 max-w-sm w-full shadow-glow">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="text-4xl mb-3">💎</div>
          <h3 className="font-heading text-xl font-bold text-cyber-gold mb-1">开通 {planName}</h3>
          <p className="text-text-muted text-sm mb-6">{price} · 联系客服完成开通</p>

          {/* 二维码占位 */}
          <div className="mx-auto w-40 h-40 bg-cyber-dark border border-cyber-gold/20 rounded-xl flex flex-col items-center justify-center mb-4">
            <div className="text-4xl mb-2">📱</div>
            <span className="text-text-muted text-xs">客服微信二维码</span>
          </div>

          <p className="text-text-secondary text-sm mb-2">
            微信扫码 / 搜索客服微信
          </p>
          <p className="text-cyber-gold font-semibold text-base mb-6">cyberfate_vip</p>

          <p className="text-text-muted text-xs mb-6">
            备注「{planName}」，客服将在 5 分钟内为您开通
          </p>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-cyber-gold-dark to-cyber-gold text-cyber-bg font-semibold py-3 rounded-lg hover:shadow-glow transition-all duration-200"
          >
            我已付款
          </button>
        </div>
      </div>
    </div>
  );
}
