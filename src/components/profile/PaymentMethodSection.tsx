'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

interface PaymentMethodSectionProps {
  currentMethod: {
    type: string;
    last4: string;
  } | null;
  onMethodUpdated: () => void;
}

export function PaymentMethodSection({ currentMethod, onMethodUpdated }: PaymentMethodSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const paymentMethods = [
    { id: 'alipay', name: '支付宝', icon: '支' },
    { id: 'wechat', name: '微信支付', icon: '微' },
    { id: 'stripe', name: '银行卡 (Stripe)', icon: 'CARD' },
  ];

  const handleUpdateMethod = async () => {
    if (!selectedMethod) return;

    setLoading(true);
    try {
      // TODO: 调用实际支付绑定流程
      // const res = await fetch('/api/subscription/update-payment-method', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ payment_method: selectedMethod })
      // });

      // 模拟成功
      setTimeout(() => {
        toast.success('支付方式已更新');
        setShowModal(false);
        onMethodUpdated();
        setLoading(false);
      }, 1000);
    } catch (err) {
      toast.error('更新失败，请重试');
      setLoading(false);
    }
  };

  const getMethodName = (type: string) => {
    switch (type) {
      case 'alipay':
        return '支付宝';
      case 'wechat':
        return '微信支付';
      case 'stripe':
        return '银行卡';
      default:
        return type;
    }
  };

  return (
    <>
      <div className="border-t border-[#E5E2DD] pt-6 mt-6">
        <h4 className="text-sm font-semibold text-[#1C1A16] mb-3">支付方式</h4>
        
        {currentMethod ? (
          <div className="flex items-center justify-between p-3 bg-[#FAF9F6] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1C1A16] rounded flex items-center justify-center text-white text-xs font-bold">
                {currentMethod.type === 'alipay' ? '支' : currentMethod.type === 'wechat' ? '微' : 'CARD'}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1C1A16]">
                  {getMethodName(currentMethod.type)}
                </p>
                <p className="text-xs text-[#1C1A16]/50">**** {currentMethod.last4}</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-[#1C1A16]/60 hover:text-[#1C1A16] transition-colors"
            >
              更改 →
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="w-full p-3 border border-[#E5E2DD] rounded-lg text-sm text-[#1C1A16] hover:bg-[#1C1A16]/[0.03] transition-colors"
          >
            + 添加支付方式
          </button>
        )}
      </div>

      {/* 更改支付方式弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1C1A16] mb-4">更改支付方式</h3>
            
            {currentMethod && (
              <div className="mb-4">
                <p className="text-sm text-[#1C1A16]/70 mb-2">当前方式：</p>
                <div className="flex items-center gap-3 p-3 bg-[#FAF9F6] rounded-lg">
                  <div className="w-8 h-8 bg-[#1C1A16] rounded flex items-center justify-center text-white text-xs font-bold">
                    {currentMethod.type === 'alipay' ? '支' : currentMethod.type === 'wechat' ? '微' : 'CARD'}
                  </div>
                  <span className="text-sm text-[#1C1A16]">
                    {getMethodName(currentMethod.type)} **** {currentMethod.last4}
                  </span>
                </div>
              </div>
            )}

            <p className="text-sm text-[#1C1A16] font-medium mb-3">选择新方式：</p>
            
            <div className="space-y-3 mb-6">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                    selectedMethod === method.id
                      ? 'border-[#1C1A16] bg-[#1C1A16]/[0.03]'
                      : 'border-[#E5E2DD] hover:border-[#1C1A16]/30'
                  }`}
                >
                  <div className="w-10 h-10 bg-[#1C1A16] rounded flex items-center justify-center text-white text-xs font-bold">
                    {method.icon}
                  </div>
                  <span className="text-sm font-medium text-[#1C1A16]">{method.name}</span>
                  {selectedMethod === method.id && (
                    <span className="ml-auto text-[#1C1A16]">✓</span>
                  )}
                </button>
              ))}
            </div>

            {selectedMethod && (
              <div className="mb-6 p-3 bg-[#FAF9F6] rounded-lg">
                <p className="text-xs text-[#1C1A16]/70">
                  ⚠️ 更改后，下次续费将使用新的支付方式扣款
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-[#E5E2DD] rounded text-[#1C1A16] hover:bg-[#1C1A16]/[0.03] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateMethod}
                disabled={!selectedMethod || loading}
                className="flex-1 px-4 py-2.5 bg-[#1C1A16] text-white rounded hover:bg-[#2A2621] transition-colors disabled:opacity-50"
              >
                {loading ? '处理中...' : '确认更改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
