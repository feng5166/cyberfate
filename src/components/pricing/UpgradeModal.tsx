'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { PricingCardList } from './PricingCardList';
import { PaymentModal } from '@/components/PaymentModal';
import { AuthModal } from '@/components/auth/AuthModal';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('专业版');
  const [visible, setVisible] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{ planName: string; price: string } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{ planName: string; price: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = 'hidden';
    } else {
      setVisible(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (session && pendingPayment) {
      setPaymentModal(pendingPayment);
      setPendingPayment(null);
    }
  }, [session, pendingPayment]);

  const isSubscribed = (session?.user as { isSubscribed?: boolean } | undefined)?.isSubscribed;

  if (isSubscribed) return null;

  const handleCTAClick = (planName: string, price: string) => {
    if (!session) {
      setPendingPayment({ planName, price: `¥${price}` });
      setAuthOpen(true);
      return;
    }
    setPaymentModal({ planName, price: `¥${price}` });
  };

  const handleViewFullPricing = () => {
    handleClose();
    router.push('/pricing');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleClose}
        />

        <div
          className={`relative w-[95%] max-w-[900px] max-h-[90vh] overflow-y-auto bg-[#FAF9F6] rounded-2xl p-5 md:p-10 shadow-2xl transition-all duration-200 ease-out ${
            visible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.95]'
          }`}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-[#9B9590] hover:text-[#1C1A16] transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-[#1C1A16] text-2xl md:text-[28px] font-semibold">
              解锁全部功能
            </h2>
            <p className="text-[#9B9590] text-sm mt-2">
              选择适合您的计划，开启完整体验
            </p>
          </div>

          <PricingCardList
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            onCTAClick={handleCTAClick}
          />

          <div className="text-center mt-8">
            <button
              onClick={handleViewFullPricing}
              className="text-sm text-[#1C1A16]/55 hover:text-[#1C1A16] transition-colors"
            >
              查看完整权益对比 →
            </button>
          </div>
        </div>
      </div>

      {paymentModal && (
        <PaymentModal
          planName={paymentModal.planName}
          price={paymentModal.price}
          onClose={() => setPaymentModal(null)}
        />
      )}

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </>
  );
}
