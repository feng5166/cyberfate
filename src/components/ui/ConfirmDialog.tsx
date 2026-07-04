'use client';

import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** 危险操作（删除等）：确认按钮用红色 */
  danger?: boolean;
}

// 品牌化确认弹窗，替代原生 window.confirm（原生弹窗阻塞线程且在移动端割裂宣纸/衬线观感）。
// 建于 Modal 之上，自带 role/aria/Esc/焦点陷阱/safe-area。
export function ConfirmDialog({
  isOpen, onClose, onConfirm, title = '确认操作', message,
  confirmText = '确认', cancelText = '取消', danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" showClose={false}>
      <div className="text-sm leading-relaxed text-brand-gray">{message}</div>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 min-h-[44px] rounded-lg border border-brand-border bg-white text-sm font-medium text-brand-ink transition-colors hover:bg-brand-bg"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => { onConfirm(); onClose(); }}
          className={`flex-1 min-h-[44px] rounded-lg text-sm font-medium text-white transition-colors ${
            danger ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-accent hover:bg-brand-accent-hover'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
