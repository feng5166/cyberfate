'use client';
import { useEffect, useState } from 'react';

// 新版本上线提示——不重复 register（SW 由 next-pwa 自动注册），只观测已有注册的更新。
// next-pwa 生成的 SW 已启用 skipWaiting + clientsClaim：新 worker 装好即激活，
// 故这里检测到「新 worker installed 且已有 controller」就提示刷新，点按 reload 即拿到新资源。
export function PwaUpdatePrompt() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    let reg: ServiceWorkerRegistration | null = null;
    let cancelled = false;

    const watch = (r: ServiceWorkerRegistration) => {
      reg = r;
      if (r.waiting && navigator.serviceWorker.controller) setUpdateReady(true);
      r.addEventListener('updatefound', () => {
        const sw = r.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      });
    };

    navigator.serviceWorker
      .getRegistration()
      .then((r) => {
        if (r && !cancelled) watch(r);
      })
      .catch(() => {});

    // 回到前台时主动查一次更新（长时间停留也能及时拿到新版）
    const onVisible = () => {
      if (document.visibilityState === 'visible') reg?.update().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (!updateReady) return null;

  return (
    <button
      onClick={() => window.location.reload()}
      className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[101] rounded-full bg-[#C2762B] px-4 py-2 text-xs font-medium text-white shadow-2xl"
    >
      ✨ 有新版本 · 点此刷新
    </button>
  );
}
