'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PLAN_NAME_TO_ID } from '@/lib/pricing-config';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface PaymentModalProps {
  planName: string;
  price: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const POLL_INTERVAL = 3000;
const MAX_POLL_DURATION = 10 * 60 * 1000;

export function PaymentModal({ planName, price, onClose, onSuccess }: PaymentModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay' | 'stripe'>('stripe');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollStartRef = useRef<number>(0);
  const modalRef = useFocusTrap(!!qrCode || loading || paymentSuccess);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setLoading(false);
    setPayMethod('stripe');
    setQrCode(null);
    setError(null);
    setOrderId(null);
    setPaymentSuccess(false);
  }, []);

  const handleClose = useCallback(() => {
    stopPolling();
    resetState();
    onClose();
  }, [stopPolling, resetState, onClose]);

  const handlePaymentSuccess = useCallback(() => {
    stopPolling();
    setPaymentSuccess(true);
    if (onSuccess) {
      onSuccess();
    } else {
      setTimeout(handleClose, 1500);
    }
  }, [stopPolling, onSuccess, handleClose]);

  const startPolling = useCallback((targetOrderId: string) => {
    stopPolling();
    pollStartRef.current = Date.now();

    pollTimerRef.current = setInterval(async () => {
      if (Date.now() - pollStartRef.current > MAX_POLL_DURATION) {
        stopPolling();
        setError('支付超时，请重试');
        return;
      }

      try {
        const res = await fetch(`/api/payment/status?orderId=${targetOrderId}`);
        const data = await res.json();
        if (data.status === 'paid') {
          handlePaymentSuccess();
        }
      } catch {
        // 网络抖动时静默忽略，继续轮询
      }
    }, POLL_INTERVAL);
  }, [stopPolling, handlePaymentSuccess]);

  useEffect(() => {
    return stopPolling;
  }, [stopPolling]);

  const handlePay = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    if (!session) {
      setLoading(false);
      router.push('/auth/login');
      return;
    }
    try {
      const planKey = PLAN_NAME_TO_ID[planName] ?? 'daily';
      
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          plan: planKey, 
          payMethod 
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        const errorMsg = data.details 
          ? `${data.error}\n详情: ${data.details}` 
          : data.error || `创建订单失败 (${res.status})`;
        setError(errorMsg);
        console.error('Payment creation failed:', data);
        return;
      }
      
      if (payMethod === 'stripe' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.qrCode) {
        setQrCode(data.qrCode);
        setOrderId(data.orderId);
        startPolling(data.orderId);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || '网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4" onClick={handleClose}>
      <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl font-bold text-primary mb-4">
          开通 {planName}
        </h2>
        
        {!qrCode ? (
          <>
            <div className="mb-6">
              <div className="text-3xl font-bold text-primary mb-2">${price.startsWith('$') ? price : `$${price}`}</div>
              <div className="text-sm text-muted">选择支付方式</div>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => setPayMethod('stripe')}
                className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                  payMethod === 'stripe'
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">CARD</div>
                <span className={`font-medium ${payMethod === 'stripe' ? 'text-purple-700' : 'text-gray-700'}`}>信用卡 / 借记卡</span>
                <span className="text-xs text-gray-400">(Stripe)</span>
                {payMethod === 'stripe' && <span className="ml-auto text-purple-500">✓</span>}
              </button>

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
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handlePay}
                disabled={loading}
                className={`flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  payMethod === 'stripe'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? '处理中...' : '确认支付'}
              </button>
            </div>
          </>
        ) : paymentSuccess ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <div className="text-xl font-bold text-green-600 mb-2">支付成功</div>
            <div className="text-sm text-gray-500">正在跳转...</div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-lg font-medium text-gray-700 mb-2">请扫码支付</div>
              <div className="text-2xl font-bold text-primary mb-4">${price.startsWith('$') ? price : `$${price}`}</div>
              <img src={qrCode} alt="支付二维码" className="mx-auto w-48 h-48 border-2 border-gray-200 rounded-lg" />
              <div className="mt-4 text-sm text-gray-500">
                使用{payMethod === 'wechat' ? '微信' : '支付宝'}扫码完成支付
              </div>
              <div className="mt-2 text-xs text-gray-400">
                支付完成后将自动跳转
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消支付
            </button>
          </>
        )}
      </div>
    </div>
  );
}
