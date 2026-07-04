'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** 无标题时用于读屏的无障碍名 */
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  /** 允许点击遮罩 / 按 Esc 关闭（默认 true） */
  dismissible?: boolean;
  showClose?: boolean;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' } as const;

// 全站弹窗唯一真源：role/aria、Esc、焦点陷阱、滚动锁、safe-area 一次做对。
// 现有各处弹窗（升级/登录/占卜/订阅）在波5 逐步迁移到此。
export function Modal({
  isOpen, onClose, title, ariaLabel, size = 'md',
  dismissible = true, showClose = true, className = '', children, footer,
}: ModalProps) {
  const trapRef = useFocusTrap(isOpen);

  // Esc 关闭 + 打开时锁定 body 滚动。
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, dismissible, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div
        className="absolute inset-0 bg-brand-ink/50 backdrop-blur-sm animate-fadeIn"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : ariaLabel}
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative w-full max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white shadow-pricing animate-slide-up',
          sizeClass[size],
          className
        )}
      >
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full text-brand-gray transition-colors hover:bg-brand-border-light hover:text-brand-ink"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <div className="p-6 sm:p-8">
          {title && (
            <h2 id="modal-title" className="mb-4 pr-8 font-display text-xl text-brand-ink">
              {title}
            </h2>
          )}
          {children}
        </div>
        {footer && <div className="border-t border-brand-border-light p-4 sm:px-8">{footer}</div>}
      </div>
    </div>
  );
}
