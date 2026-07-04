'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

interface CancelSectionProps {
  expireDate: string;
  onCancelled: () => void;
}

export function CancelSection({ expireDate, onCancelled }: CancelSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: feedback.length > 0 ? feedback.join(', ') + (otherReason ? `: ${otherReason}` : '') : null
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(`订阅将在 ${expireDate} 到期后取消`);
        setShowModal(false);
        onCancelled();
      } else {
        toast.error(data.error || '取消失败');
      }
    } catch (err) {
      toast.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeedback = (option: string) => {
    setFeedback(prev =>
      prev.includes(option)
        ? prev.filter(f => f !== option)
        : [...prev, option]
    );
  };

  return (
    <>
      <div className="border-t border-[#E5E2DD] pt-6 mt-6">
        <h4 className="text-sm font-semibold text-[#1C1A16] mb-3">订阅操作</h4>
        <button
          onClick={() => setShowModal(true)}
          className="text-red-600 text-sm hover:text-red-700 transition-colors"
        >
          ⚠️ 取消自动续订
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1C1A16] mb-4">确定要取消订阅吗？</h3>
            
            <p className="text-sm text-[#1C1A16]/70 mb-2">
              取消后您将继续享受会员权益直到当前周期结束：
            </p>
            <p className="text-sm font-semibold text-[#1C1A16] mb-4">{expireDate}</p>
            <p className="text-sm text-[#1C1A16]/70 mb-6">之后将自动降为免费用户。</p>

            <div className="mb-6">
              <p className="text-sm text-[#1C1A16] font-medium mb-3">
                ▸ 为什么离开？（可选，帮助我们改进）
              </p>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feedback.includes('价格太贵')}
                    onChange={() => toggleFeedback('价格太贵')}
                    className="w-4 h-4"
                  />
                  <span className="text-[#1C1A16]/80">价格太贵</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feedback.includes('功能用不上')}
                    onChange={() => toggleFeedback('功能用不上')}
                    className="w-4 h-4"
                  />
                  <span className="text-[#1C1A16]/80">功能用不上</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feedback.includes('使用频率低')}
                    onChange={() => toggleFeedback('使用频率低')}
                    className="w-4 h-4"
                  />
                  <span className="text-[#1C1A16]/80">使用频率低</span>
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="其他原因..."
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E2DD] rounded text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-[#E5E2DD] rounded text-[#1C1A16] hover:bg-[#1C1A16]/[0.03] transition-colors"
              >
                再想想
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {loading ? '处理中...' : '确认取消'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
