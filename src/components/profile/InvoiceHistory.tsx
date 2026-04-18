'use client';

import { useEffect, useState, useCallback } from 'react';
import { PaymentModal } from '@/components/PaymentModal';
import { getPlanName } from '@/lib/pricing-config';

interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  outTradeNo: string;
}

export function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  const loadInvoices = useCallback(() => {
    fetch('/api/subscription/invoices')
      .then(r => r.json())
      .then(data => {
        setInvoices(data.invoices || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Load invoices error:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  if (loading) {
    return (
      <div className="bg-white border border-[#E5E2DD] rounded-xl p-6">
        <h3 className="text-base font-semibold text-[#1C1A16] mb-4">账单历史</h3>
        <p className="text-[#1C1A16]/50 text-sm">加载中...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white border border-[#E5E2DD] rounded-xl p-6">
        <h3 className="text-base font-semibold text-[#1C1A16] mb-4">账单历史</h3>
        <p className="text-[#1C1A16]/50 text-sm">暂无支付记录</p>
      </div>
    );
  }

  const getStatusBadge = (invoice: Invoice) => {
    switch (invoice.status) {
      case 'paid':
        return <span className="text-emerald-600 text-xs">✓ 已支付</span>;
      case 'failed':
        return <span className="text-red-600 text-xs">✗ 失败</span>;
      case 'pending':
        return (
          <button
            onClick={() => setPayingInvoice(invoice)}
            className="text-xs px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-colors cursor-pointer font-medium"
          >
            去支付
          </button>
        );
      default:
        return <span className="text-[#1C1A16]/40 text-xs">{invoice.status}</span>;
    }
  };

  return (
    <>
      <div className="bg-white border border-[#E5E2DD] rounded-xl p-6">
        <h3 className="text-base font-semibold text-[#1C1A16] mb-4">账单历史</h3>
        
        <div className="space-y-3">
          {invoices.map(invoice => (
            <div
              key={invoice.id}
              className="flex items-center justify-between py-2.5 border-b border-[#E5E2DD]/50 last:border-0"
            >
              <div className="flex-1">
                <p className="text-sm text-[#1C1A16] font-medium">{invoice.description}</p>
                <p className="text-xs text-[#1C1A16]/50 mt-0.5">{invoice.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#1C1A16]">
                  ${invoice.amount.toFixed(2)}
                </span>
                {getStatusBadge(invoice)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {payingInvoice && (
        <PaymentModal
          planName={getPlanName(payingInvoice.plan)}
          price={`$${payingInvoice.amount.toFixed(2)}`}
          onClose={() => setPayingInvoice(null)}
          onSuccess={() => {
            setPayingInvoice(null);
            loadInvoices();
          }}
        />
      )}
    </>
  );
}
