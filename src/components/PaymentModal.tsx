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
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setError(null);
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: planName === '月卡' ? 'monthly' : planName === '季卡' ? 'quarterly' : 'yearly', 
          payMethod 
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || '创建订单失败');
        return;
      }
      
      if (data.qrCode) {
        setQrCode(data.qrCode);
      }
    } catch (err) {
      setError('网络错误，请重试');
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
        
        {!qrCode ? (
          <>
            <div className="mb-6">
              <div className="text-3xl font-bold text-primary mb-2">{price}</div>
              <div className="text-sm text-muted">选择支付方式</div>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => setPayMethod('wechat')}
                className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                  payMethod === 'wechat' 
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">微信</div>
                <span className={`font-medium ${payMethod === 'wechat' ? 'text-green-700' : 'text-gray-700'}`}>微信支付</span>
                {payMethod === 'wechat' && <span className="ml-auto text-green-500">✓</span>}
              </button>

              <button
                onClick={() => setPayMethod('alipay')}
                className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                  payMethod === 'alipay' 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">支付宝</div>
                <span className={`font-medium ${payMethod === 'alipay' ? 'text-blue-700' : 'text-gray-700'}`}>支付宝</span>
                {payMethod === 'alipay' && <span className="ml-auto text-blue-500">✓</span>}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handlePay}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '处理中...' : '确认支付'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-lg font-medium text-gray-700 mb-2">请扫码支付</div>
              <div className="text-2xl font-bold text-primary mb-4">{price}</div>
              <img src={qrCode} alt="支付二维码" className="mx-auto w-48 h-48 border-2 border-gray-200 rounded-lg" />
              <div className="mt-4 text-sm text-gray-500">
                使用{payMethod === 'wechat' ? '微信' : '支付宝'}扫码完成支付
              </div>
              <div className="mt-2 text-xs text-orange-600">
                ⚠️ 演示模式：实际项目需接入真实支付
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
            >
              关闭
            </button>
          </>
        )}
      </div>
    </div>
  );
}
