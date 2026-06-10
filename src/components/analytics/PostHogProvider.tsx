'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

const SENSITIVE_KEYS = ['name', 'birthDate', 'birth_date', 'gender', 'birthHour', 'birth_hour', 'userName', 'email'];

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
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
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
