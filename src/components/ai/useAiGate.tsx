'use client';

import { useCallback, useState } from 'react';
import { AuthModal } from '@/components/auth/AuthModal';
import { QuotaLimitModal } from '@/components/QuotaLimitModal';

/**
 * AI 门禁统一处理（跨模块一致）：
 * - 游客（未登录）被拦 → 弹登录引导 AuthModal
 * - 登录未订阅用户被配额 / 会员功能拦 → 弹升级引导 QuotaLimitModal
 *
 * 用法：
 *   const { status } = useSession();
 *   const gate = useAiGate(status === 'authenticated');
 *   // fetch 后：
 *   if (!res.ok) {
 *     const body = await res.json().catch(() => ({}));
 *     if (gate.handle(res.status, body.code || body.error)) return; // 已弹窗，中止
 *     setError(body.message || body.error || '请求失败');
 *     return;
 *   }
 *   // JSX 末尾渲染一次：<AiGateModals gate={gate} callbackUrl="/xxx" />
 */

// 触发门禁弹窗的业务错误码（服务端统一约定）
const GATE_CODES = new Set([
  'LOGIN_REQUIRED',
  'GUEST_LIMIT_REACHED',
  'QUOTA_EXCEEDED',
  'DAILY_LIMIT_REACHED',
  'SUBSCRIPTION_REQUIRED',
  'VIP_REQUIRED',
]);

// 明确指向「登录」的码（即便已登录也应引导登录的少数场景）
const LOGIN_CODES = new Set(['LOGIN_REQUIRED', 'GUEST_LIMIT_REACHED']);

export interface AiGate {
  /** 处理 AI 接口错误：命中门禁则弹对应弹窗并返回 true（调用方据此中止后续、避免再 setError） */
  handle: (status: number, code?: string) => boolean;
  /** 直接弹登录引导（如游客点「重新分析」前置拦截） */
  openAuth: () => void;
  /** 直接弹升级引导 */
  openQuota: () => void;
  authOpen: boolean;
  quotaOpen: boolean;
  closeAuth: () => void;
  closeQuota: () => void;
}

export function useAiGate(isLoggedIn: boolean): AiGate {
  const [authOpen, setAuthOpen] = useState(false);
  const [quotaOpen, setQuotaOpen] = useState(false);

  const handle = useCallback(
    (status: number, code?: string): boolean => {
      const isGate = status === 401 || (code != null && GATE_CODES.has(code));
      if (!isGate) return false;
      // 未登录、或明确登录类错误码 → 登录引导；否则（登录未订阅触发配额 / 会员）→ 升级引导
      if (!isLoggedIn || (code != null && LOGIN_CODES.has(code))) {
        setAuthOpen(true);
      } else {
        setQuotaOpen(true);
      }
      return true;
    },
    [isLoggedIn],
  );

  return {
    handle,
    openAuth: useCallback(() => setAuthOpen(true), []),
    openQuota: useCallback(() => setQuotaOpen(true), []),
    authOpen,
    quotaOpen,
    closeAuth: useCallback(() => setAuthOpen(false), []),
    closeQuota: useCallback(() => setQuotaOpen(false), []),
  };
}

/** 渲染门禁弹窗（稳定组件，放在 JSX 任意位置一次） */
export function AiGateModals({ gate, callbackUrl }: { gate: AiGate; callbackUrl?: string }) {
  return (
    <>
      <AuthModal isOpen={gate.authOpen} onClose={gate.closeAuth} callbackUrl={callbackUrl} />
      {gate.quotaOpen && <QuotaLimitModal onClose={gate.closeQuota} />}
    </>
  );
}
