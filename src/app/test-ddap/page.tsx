'use client';

import DailyDetailAnalysis from '@/components/daily/DailyDetailAnalysis';
import Link from 'next/link';

export default function TestDDAPPage() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: 24, background: '#FAF9F6', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', textAlign: 'center' }}>每日运势 · v2 验收</h1>

      {/* DailyDetailAnalysis v2 - idle 态 */}
      <DailyDetailAnalysis
        isLoggedIn={true}
        isVip={false}
        onLoginRequired={() => {}}
        targetDate="2026-05-31"
        hasBirthInfo={true}
      />

      {/* 八字深度分析卡片 */}
      <Link href="/bazi">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', backgroundColor: 'white', borderRadius: 12, border: '1px solid #E5E7EB', cursor: 'pointer' }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>☰</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1C1A16' }}>八字深度分析</div>
            <div style={{ fontSize: 12, color: 'rgba(28,26,22,0.55)', marginTop: 2 }}>解读完整命盘与流年大运</div>
          </div>
          <button style={{ backgroundColor: '#C8622A', color: 'white', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', flexShrink: 0 }}>查看</button>
        </div>
      </Link>

      {/* 六爻起卦入口 */}
      <Link href="/liuyao">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', backgroundColor: 'white', borderRadius: 12, border: '1px solid #E5E7EB', cursor: 'pointer' }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>☷</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1C1A16' }}>六爻起卦</div>
            <div style={{ fontSize: 12, color: 'rgba(28,26,22,0.55)', marginTop: 2 }}>AI 即时解卦，针对具体事项</div>
          </div>
          <button style={{ backgroundColor: '#1F2937', color: 'white', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', flexShrink: 0 }}>起卦</button>
        </div>
      </Link>
    </div>
  );
}
