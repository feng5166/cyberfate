'use client';
import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandaloneMode = ('standalone' in navigator) && (navigator as any).standalone;
    if (isIOS && !isInStandaloneMode) {
      const lastPrompt = localStorage.getItem('ios-install-prompted');
      if (!lastPrompt || Date.now() - Number(lastPrompt) > 7 * 24 * 3600 * 1000) {
        setTimeout(() => setShowIOSGuide(true), 3000);
      }
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowAndroidPrompt(false);
    setDeferredPrompt(null);
  };

  const dismissIOS = () => {
    localStorage.setItem('ios-install-prompted', String(Date.now()));
    setShowIOSGuide(false);
  };

  if (showAndroidPrompt) return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-[#1C1A16] text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3">
      <span className="text-2xl">🔮</span>
      <div className="flex-1">
        <p className="text-sm font-semibold">添加到主屏幕</p>
        <p className="text-xs text-white/60">像 App 一样使用 CyberFate</p>
      </div>
      <button onClick={handleAndroidInstall} className="bg-[#C2762B] text-white text-sm px-4 py-2 rounded-xl">安装</button>
      <button onClick={() => setShowAndroidPrompt(false)} className="text-white/40 text-xs px-2">✕</button>
    </div>
  );

  if (showIOSGuide) return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E0D8] rounded-t-2xl p-5 shadow-2xl">
      <div className="flex justify-between items-start mb-3">
        <p className="text-sm font-semibold text-[#1C1A16]">添加到主屏幕</p>
        <button onClick={dismissIOS} className="text-[#1C1A16]/40 text-lg leading-none">✕</button>
      </div>
      <p className="text-sm text-[#1C1A16]/70 mb-4">
        点击底部 <span className="inline-block px-1.5 py-0.5 bg-[#FAF3EC] rounded text-[#C2762B] font-medium">□↑ 分享</span> 按钮，然后选择「添加到主屏幕」
      </p>
      <div className="flex items-center gap-2 text-xs text-[#1C1A16]/50">
        <span>🔮</span>
        <span>像 App 一样启动，无需地址栏</span>
      </div>
    </div>
  );

  return null;
}
