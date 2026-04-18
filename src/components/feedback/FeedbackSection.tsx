'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

type FeedbackType = 'suggestion' | 'bug' | 'experience' | 'other';

const FEEDBACK_TAGS: { label: string; value: FeedbackType }[] = [
  { label: '功能建议', value: 'suggestion' },
  { label: 'Bug反馈', value: 'bug' },
  { label: '体验问题', value: 'experience' },
  { label: '其他', value: 'other' },
];

const MAX_FEEDBACK_LENGTH = 500;

type ToastState = {
  message: string;
  variant: 'success' | 'error';
} | null;

type SubmitState = 'idle' | 'loading' | 'success';

export default function FeedbackSection() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [content, setContent] = useState('');
  const [type, setType] = useState<FeedbackType | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const trimmedLength = content.trim().length;
  const currentLength = content.length;
  const isOverLimit = currentLength > MAX_FEEDBACK_LENGTH;
  const isNearLimit = currentLength > 450 && !isOverLimit;

  const disabled =
    submitState === 'loading' ||
    submitState === 'success' ||
    trimmedLength === 0 ||
    isOverLimit;

  const handleTagClick = (value: FeedbackType) => {
    setType((prev) => (prev === value ? null : value));
  };

  const handleSubmit = async () => {
    if (disabled) return;

    setSubmitState('loading');

    try {
      const userAgent =
        typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
      const pageUrl =
        typeof window !== 'undefined'
          ? window.location.href
          : pathname || undefined;

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          type: type ?? undefined,
          pageUrl,
          userAgent,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        message?: string;
      };

      if (!res.ok || !data.success) {
        const errorMessageMap: Record<string, string> = {
          CONTENT_EMPTY: '请输入反馈内容',
          CONTENT_TOO_LONG: '反馈内容超过 500 字',
          RATE_LIMITED: '提交太频繁，请稍后再试',
          INTERNAL_ERROR: '提交失败，请稍后再试',
        };
        const msg =
          (data.error && errorMessageMap[data.error]) ||
          data.message ||
          '提交失败，请稍后再试';
        setSubmitState('idle');
        setToast({ message: msg, variant: 'error' });
        return;
      }

      setSubmitState('success');
      setToast({
        message: '感谢您的反馈，我们已收到！',
        variant: 'success',
      });

      setTimeout(() => {
        setContent('');
        setType(null);
        setSubmitState('idle');
      }, 1500);
    } catch (err) {
      console.error('[feedback] submit failed:', err);
      setSubmitState('idle');
      setToast({ message: '网络异常，请稍后再试', variant: 'error' });
    }
  };

  const buttonLabel = (() => {
    if (submitState === 'loading') return '提交中...';
    if (submitState === 'success') return '已收到';
    return '提交反馈';
  })();

  const counterColor = isOverLimit
    ? 'text-red-500'
    : isNearLimit
    ? 'text-orange-500'
    : 'text-[#B8B4AE]';

  return (
    <section className="bg-[#FAF9F6] border-t border-[rgba(28,26,22,0.06)] py-8 px-4 md:py-12 md:px-6">
      <div className="max-w-[720px] mx-auto">
        <h2 className="text-lg font-medium text-center text-[#1C1A16] mb-6">
          有任何想法或建议？我们想听听
        </h2>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_FEEDBACK_LENGTH))}
              placeholder="请输入您的反馈..."
              maxLength={MAX_FEEDBACK_LENGTH}
              disabled={submitState === 'loading' || submitState === 'success'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-[#D5D0CA] bg-white text-sm text-[#1C1A16] placeholder:text-[#B8B4AE] outline-none focus:ring-2 focus:ring-[#1C1A16]/10 transition-all disabled:opacity-60"
            />
            <div
              className={`mt-1.5 flex justify-end text-xs ${counterColor} transition-colors`}
            >
              {currentLength}/{MAX_FEEDBACK_LENGTH}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled}
            className={`h-[46px] self-start px-6 rounded-xl text-white text-sm font-medium whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
              submitState === 'success'
                ? 'bg-green-600'
                : 'bg-[#1C1A16] hover:bg-[#1C1A16]/90'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitState === 'loading' && (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {buttonLabel}
          </button>
        </div>

        <div className="flex justify-center gap-2 flex-wrap mt-4">
          {FEEDBACK_TAGS.map((tag) => {
            const active = type === tag.value;
            return (
              <button
                key={tag.value}
                type="button"
                onClick={() => handleTagClick(tag.value)}
                className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all ${
                  active
                    ? 'bg-[#1C1A16] text-white border-[#1C1A16]'
                    : 'border-[#D5D0CA] text-[#6B6560] hover:bg-[#1C1A16] hover:text-white hover:border-[#1C1A16]'
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>

        {!session && (
          <p className="mt-3 text-center text-xs text-[#B8B4AE]">
            无需登录也可提交反馈
          </p>
        )}
      </div>

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
          <div
            className={`px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
              toast.variant === 'success' ? 'bg-green-600' : 'bg-red-500'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </section>
  );
}
