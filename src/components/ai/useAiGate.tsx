'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';

// chunk 拉取期占位：弱网下 dynamic 默认渲染 null，被门禁拦住时会像什么都没发生。
// 先铺一层与弹窗同款的遮罩 + 墨色 spinner，让拦截立刻可见（设计系统「墨色纸面」）。
function ModalChunkLoading() {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-brand-ink/50 backdrop-blur-sm"
      role="status"
      aria-label="加载中"
    >
      <div className="animate-spin motion-reduce:animate-none w-7 h-7 rounded-full border-2 border-[#FAF9F6]/30 border-t-[#FAF9F6]" />
    </div>
  );
}

// 门禁弹窗只在被拦截时出现，懒加载避免随各模块 PageClient 进首屏 chunk
const AuthModal = dynamic(
  () => import('@/components/auth/AuthModal').then((m) => m.AuthModal),
  { ssr: false, loading: ModalChunkLoading },
);
const QuotaLimitModal = dynamic(
  () => import('@/components/QuotaLimitModal').then((m) => m.QuotaLimitModal),
  { ssr: false, loading: ModalChunkLoading },
);

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

export interface AuthReason {
  title: string;
  desc: string;
}

/** 据门禁错误码生成登录框上下文说明，降低游客「为何登录」的理解成本 */
function reasonForCode(code?: string): AuthReason {
  if (code === 'GUEST_LIMIT_REACHED' || code === 'DAILY_LIMIT_REACHED') {
    return {
      title: '今日免费次数已用完',
      desc: '游客每天可免费体验。登录后每天可继续免费使用，并保存记录；开通会员不限次。',
    };
  }
  return {
    title: '登录后即可使用',
    desc: '登录或注册账号即可免费体验该功能；开通会员不限次并解锁更多权益。',
  };
}

export interface AiGate {
  /** 处理 AI 接口错误：命中门禁则弹对应弹窗并返回 true（调用方据此中止后续、避免再 setError） */
  handle: (status: number, code?: string) => boolean;
  /** 直接弹登录引导（如游客点「重新分析」前置拦截），可附上下文说明 */
  openAuth: (reason?: AuthReason) => void;
  /** 直接弹升级引导 */
  openQuota: () => void;
  authOpen: boolean;
  authReason?: AuthReason;
  quotaOpen: boolean;
  closeAuth: () => void;
  closeQuota: () => void;
}

export function useAiGate(isLoggedIn: boolean): AiGate {
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<AuthReason | undefined>(undefined);
  const [quotaOpen, setQuotaOpen] = useState(false);

  const handle = useCallback(
    (status: number, code?: string): boolean => {
      const isGate = status === 401 || (code != null && GATE_CODES.has(code));
      if (!isGate) return false;
      // 未登录、或明确登录类错误码 → 登录引导（带上下文）；否则（登录未订阅触发配额 / 会员）→ 升级引导
      if (!isLoggedIn || (code != null && LOGIN_CODES.has(code))) {
        setAuthReason(reasonForCode(code));
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
    openAuth: useCallback((reason?: AuthReason) => { setAuthReason(reason); setAuthOpen(true); }, []),
    openQuota: useCallback(() => setQuotaOpen(true), []),
    authOpen,
    authReason,
    quotaOpen,
    closeAuth: useCallback(() => { setAuthOpen(false); setAuthReason(undefined); }, []),
    closeQuota: useCallback(() => setQuotaOpen(false), []),
  };
}

/** 渲染门禁弹窗（稳定组件，放在 JSX 任意位置一次） */
export function AiGateModals({ gate, callbackUrl }: { gate: AiGate; callbackUrl?: string }) {
  return (
    <>
      {/* 仅 open 时挂载：配合 dynamic 实现被拦截时才拉取 chunk；关闭动画由 AuthModal 内部 setTimeout(onClose) 保证先播完再卸载 */}
      {gate.authOpen && (
        <AuthModal isOpen={gate.authOpen} onClose={gate.closeAuth} callbackUrl={callbackUrl} reason={gate.authReason} />
      )}
      {gate.quotaOpen && <QuotaLimitModal onClose={gate.closeQuota} />}
    </>
  );
}
