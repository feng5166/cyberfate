'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface PaymentModalProps {
  planName: string;
  price: string;
  onClose: () => void;
}

export function PaymentModal({ planName, price, onClose }: PaymentModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');

  const handlePay = async () => {
    if (!session) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName.toLowerCase().replace('卡', ''), payMethod }),
      });

      const data = await res.json();
      if (data.qrCode) {
        // 显示二维码
        alert('请使用微信/支付宝扫码支付（演示模式）');
      }
    } catch (error) {
      alert('创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl font-bold text-primary mb-4">
          开通 {planName}
        </h2>
        
        <div className="mb-6">
          <div className="text-3xl font-bold text-primary mb-2">{price}</div>
          <div className="text-sm text-muted">选择支付方式</div>
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => setPayMethod('wechat')}
            className={`w-full p-4 border rounded-lg flex items-center gap-3 transition-colors ${
              payMethod === 'wechat' ? 'border-primary bg-background-alt' : 'border-border'
            }`}
          >
            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white text-xs">微信</div>
            <span className="text-secondary">微信支付</span>
          </button>

          <button
            onClick={() => setPayMethod('alipay')}
            className={`w-full p-4 border rounded-lg flex items-center gap-3 transition-colors ${
              payMethod === 'alipay' ? 'border-primary bg-background-alt' : 'border-border'
            }`}
          >
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-xs">支付宝</div>
            <span className="text-secondary">支付宝</span>
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded text-secondary hover:bg-background-alt transition-colors"
          >
            取消
          </button>
          <button
            onClick={handlePay}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? '处理中...' : '确认支付'}
          </button>
        </div>
      </div>
    </div>
  );
}
