'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';
import { track } from '@/lib/analytics';

// 安装引导：安卓/桌面用 beforeinstallprompt 直装；iOS 走 Safari「添加到主屏幕」图文引导。
// 健壮性（借鉴 stocktell）：
// - 装过(appinstalled / accepted) 或 点过「不再提示」→ 永久不再骚扰
// - 国内安卓 Chrome 装 PWA 需联 Google WebAPK 铸包，常失败 → 提供浏览器菜单兜底提示
// - 成功以 appinstalled 为准给反馈 + 埋点
const TRIED_KEY = 'cf_pwa_install_tried';
const DISMISS_KEY = 'cf_pwa_install_dismissed';
const IOS_SNOOZE_KEY = 'cf_pwa_ios_snooze';
const WEEK = 7 * 24 * 3600 * 1000;

type Toast = { ok: boolean; text: string } | null;

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [standalone, setStandalone] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [hidden, setHidden] = useState(true); // 默认隐藏，挂载后按 localStorage 决定
  const [reprompt, setReprompt] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const flash = useCallback((t: NonNullable<Toast>) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)');
    const standaloneNow = mql.matches || (navigator as any).standalone === true;
    setStandalone(standaloneNow);

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const android = /android/i.test(navigator.userAgent);
    setIsIOS(ios);
    setIsAndroid(android);

    let permaHidden = false;
    try {
      permaHidden = !!localStorage.getItem(TRIED_KEY) || !!localStorage.getItem(DISMISS_KEY);
    } catch {
      /* ignore */
    }
    setHidden(permaHidden);

    // iOS 无 beforeinstallprompt：未装 / 未永久关闭 / 未在 7 天 snooze 内，则延时弹图文引导
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (ios && !standaloneNow && !permaHidden) {
      let snoozed = false;
      try {
        const t = localStorage.getItem(IOS_SNOOZE_KEY);
        snoozed = !!t && Date.now() - Number(t) < WEEK;
      } catch {
        /* ignore */
      }
      if (!snoozed) iosTimer = setTimeout(() => setShowIOSGuide(true), 3000);
    }

    const onBIP = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      try {
        if (localStorage.getItem(TRIED_KEY)) setReprompt(true);
      } catch {
        /* ignore */
      }
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
      setShowIOSGuide(false);
      try {
        localStorage.setItem(TRIED_KEY, '1');
      } catch {
        /* ignore */
      }
      setHidden(true);
      flash({ ok: true, text: '✅ 已添加 · 去主屏 / 桌面找「CyberFate」图标' });
      track('pwa_installed');
    };
    const onModeChange = (e: MediaQueryListEvent) => setStandalone(e.matches);

    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    mql.addEventListener?.('change', onModeChange);
    return () => {
      if (iosTimer) clearTimeout(iosTimer);
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
      mql.removeEventListener?.('change', onModeChange);
    };
  }, [flash]);

  async function install() {
    if (!deferred) return;
    track('pwa_install_click');
    deferred.prompt();
    try {
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') {
        try {
          localStorage.setItem(TRIED_KEY, '1');
        } catch {
          /* ignore */
        }
        setHidden(true); // 已发起安装（WebAPK 是否铸包成功前端无法确知），不再显示
      } else {
        flash({ ok: false, text: '已取消，可随时再点此添加' });
        track('pwa_install_dismissed');
      }
    } catch {
      /* 用户直接关弹窗 */
    } finally {
      setDeferred(null);
    }
  }

  function dismissForever() {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setHidden(true);
    setShowIOSGuide(false);
  }

  function snoozeIOS() {
    try {
      localStorage.setItem(IOS_SNOOZE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setShowIOSGuide(false);
  }

  const showInstallBar = !standalone && !hidden && !!deferred;
  if (!showInstallBar && !showIOSGuide && !toast) return null;

  return (
    <>
      {toast && (
        <div
          role="status"
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[101] max-w-[260px] rounded-xl px-4 py-2 text-center text-xs leading-relaxed text-white shadow-2xl ${
            toast.ok ? 'bg-[#3A7D44]' : 'bg-[#1C1A16]'
          }`}
        >
          {toast.text}
        </div>
      )}

      {showInstallBar && (
        <div className="fixed bottom-20 left-4 right-4 z-50">
          <div className="bg-[#1C1A16] text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-96x96.png" alt="CyberFate" className="w-10 h-10 rounded-xl" />
            <div className="flex-1">
              <p className="text-sm font-semibold">添加到主屏幕</p>
              <p className="text-xs text-white/60">像 App 一样使用 · 离线可看历史</p>
            </div>
            <button onClick={install} className="bg-[#C2762B] text-white text-sm px-4 py-2 rounded-xl">
              安装
            </button>
            <button onClick={dismissForever} aria-label="不再提示" className="text-white/40 text-xs px-1">
              ✕
            </button>
          </div>
          {isAndroid && reprompt && (
            <div className="mt-2 rounded-xl bg-[#1C1A16]/90 px-3 py-2 text-[11px] leading-relaxed text-white/80">
              上次似乎没装上？国内安卓可改用浏览器 <b>⋮ 菜单 →「添加到主屏幕」</b> 更稳。
            </div>
          )}
        </div>
      )}

      {showIOSGuide && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E0D8] rounded-t-2xl p-5 shadow-2xl">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-semibold text-[#1C1A16]">添加到主屏幕</p>
            <button onClick={snoozeIOS} className="text-[#1C1A16]/40 text-lg leading-none" aria-label="关闭">
              ✕
            </button>
          </div>
          <p className="text-sm text-[#1C1A16]/70 mb-4">
            用 <b>Safari</b> 打开 → 点底部{' '}
            <span className="inline-block px-1.5 py-0.5 bg-[#FAF3EC] rounded text-[#C2762B] font-medium">□↑ 分享</span>{' '}
            → 选「添加到主屏幕」
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#1C1A16]/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-72x72.png" alt="CyberFate" className="w-6 h-6 rounded-lg" />
              <span>像 App 一样启动，无需地址栏</span>
            </div>
            <button onClick={dismissForever} className="text-xs text-[#1C1A16]/40">
              不再提示
            </button>
          </div>
        </div>
      )}
    </>
  );
}
