'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem { id: number; kind: ToastKind; message: string }

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastCtx = createContext<{ show: (kind: ToastKind, message: string) => void } | null>(null);

const KIND = {
  success: { Icon: CheckCircle2, cls: 'text-green-600' },
  error: { Icon: XCircle, cls: 'text-red-500' },
  info: { Icon: Info, cls: 'text-brand-accent' },
} as const;

function Toaster({ items, onClose }: { items: ToastItem[]; onClose: (id: number) => void }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] flex flex-col items-center gap-2 px-4"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      aria-live="polite"
      aria-atomic="true"
    >
      {items.map((t) => {
        const { Icon, cls } = KIND[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border border-brand-border-light bg-white px-4 py-3 shadow-card-hover animate-slideDown"
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cls}`} />
            <p className="flex-1 text-sm leading-relaxed text-brand-ink">{t.message}</p>
            <button
              type="button"
              onClick={() => onClose(t.id)}
              aria-label="关闭"
              className="-mr-1 -mt-0.5 flex h-6 w-6 items-center justify-center rounded-md text-brand-light hover:text-brand-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const show = useCallback((kind: ToastKind, message: string) => {
    const id = ++idRef.current;
    setItems((l) => [...l, { id, kind, message }]);
    setTimeout(() => remove(id), 3600);
  }, [remove]);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <Toaster items={items} onClose={remove} />
    </ToastCtx.Provider>
  );
}

// useToast：拿到 success/error/info。若组件不在 Provider 内（理论不该发生），
// 回退到原生 alert，保证永不抛错、消息永不丢——尤其保护支付等关键路径。
export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  const fallback = (m: string) => { if (typeof window !== 'undefined') window.alert(m); };
  return {
    success: (m) => (ctx ? ctx.show('success', m) : fallback(m)),
    error: (m) => (ctx ? ctx.show('error', m) : fallback(m)),
    info: (m) => (ctx ? ctx.show('info', m) : fallback(m)),
  };
}
