'use client';

import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-background-alt flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">😔</div>
        <h1 className="font-heading text-3xl font-bold text-primary mb-4">支付已取消</h1>
        <p className="text-secondary mb-8">你可以随时重新开通会员</p>
        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            重新查看套餐
          </Link>
          <Link
            href="/"
            className="block w-full px-6 py-3 border border-primary/30 text-secondary rounded-lg hover:bg-background-alt transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
