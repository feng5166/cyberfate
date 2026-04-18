'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center p-8 rounded-2xl bg-white border border-gray-200 shadow-sm max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">页面出错了</h2>
        <p className="text-gray-500 text-sm mb-6">
          抱歉，页面遇到了意外错误。请稍后重试。
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
}
