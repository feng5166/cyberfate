'use client';

import { useEffect } from 'react';

const SENSITIVE_KEYS = ['name', 'birthDate', 'birth_date', 'gender', 'birthHour', 'birth_hour', 'userName', 'email'];

/**
 * 延迟加载 PostHog：posthog-js(~50KB+) 不再进首屏 bundle，
 * 改为「首次用户交互」或「浏览器空闲」后动态 import + init（取最先到达者）。
 * track() 直接读 window.posthog，无需 React Provider 包裹。
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let loaded = false;

    const init = () => {
      if (loaded) return;
      loaded = true;
      cleanup();
      import('posthog-js')
        .then(({ default: posthog }) => {
          posthog.init('phc_knMTDVL9BJAZzFWYSWkkizjMdxznwiJyxGX3XcnLagzo', {
            api_host: 'https://app.posthog.com',
            person_profiles: 'identified_only',
            capture_pageview: true,
            capture_pageleave: true,
            autocapture: false,             // 关闭自动捕获表单/点击，防止采集生辰等输入内容
            disable_session_recording: true, // 关闭录屏
            sanitize_properties: (properties) => {
              // mask URL 中的敏感参数
              if (properties['$current_url']) {
                try {
                  const url = new URL(properties['$current_url'] as string);
                  ['name', 'birthDate', 'birth_date', 'gender', 'birthHour'].forEach((p) =>
                    url.searchParams.delete(p)
                  );
                  properties['$current_url'] = url.toString();
                } catch {}
              }
              // mask 任何误传的敏感字段（生辰八字/姓名/性别等隐私数据）
              SENSITIVE_KEYS.forEach((key) => {
                if (properties[key] !== undefined) {
                  properties[key] = '[MASKED]';
                }
              });
              return properties;
            },
          });
        })
        .catch(() => { loaded = false; });
    };

    const events: (keyof WindowEventMap)[] = ['scroll', 'pointerdown', 'keydown', 'touchstart'];
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    const cic = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      events.forEach((e) => window.removeEventListener(e, init));
      if (idleId != null && cic) cic(idleId);
      clearTimeout(timer);
    };

    events.forEach((e) => window.addEventListener(e, init, { once: true, passive: true }));
    // 兜底：空闲时或最迟 ~3.5s 后加载，保证无交互用户也被统计
    if (ric) idleId = ric(init, { timeout: 4000 });
    timer = setTimeout(init, 3500);

    return cleanup;
  }, []);

  return <>{children}</>;
}
