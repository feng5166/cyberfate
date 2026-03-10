'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background-alt flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">✨</div>
        <h1 className="font-heading text-3xl font-bold text-primary mb-4">支付成功！</h1>
        <p className="text-secondary mb-2">感谢你开通赛博命理师会员</p>
        <p className="text-secondary mb-8">你的专属 AI 命理体验已解锁</p>
        <div className="space-y-3">
          <Link
            href="/bazi"
            className="block w-full px-6 py-3 bg-cyber-gold text-cyber-bg font-semibold rounded-lg hover:bg-cyber-gold-dark transition-colors"
          >
            开始八字分析
          </Link>
          <Link
            href="/"
            className="block w-full px-6 py-3 border border-primary/30 text-secondary rounded-lg hover:bg-white/5 transition-colors"
          >
            返回首页（{countdown}s）
          </Link>
        </div>
      </div>
    </div>
  );
}
