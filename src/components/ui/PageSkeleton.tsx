// 路由级骨架屏（配合各路由 loading.tsx 使用）：
// 无 'use client'——纯静态标记可在服务端渲染，导航瞬间即可上屏，替代白屏等待。
// 视觉遵循设计系统「墨色纸面」：#FAF9F6 纸底 + 白卡 + 灰阶占位（不引入彩色）。

interface PageSkeletonProps {
  /** form = 表单页（标题 + 一张输入卡）；result = 结果/内容页（标题 + 多张内容卡） */
  variant?: 'form' | 'result';
}

/** 灰阶 shimmer 占位条；reduced-motion 下由下方 media query 降级为静态灰块 */
function Bar({ className = '' }: { className?: string }) {
  return <div className={`cf-shimmer rounded-lg ${className}`} aria-hidden="true" />;
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    // 设计系统 §4 标准卡：rounded-2xl + border-[#1C1A16]/8 + 白底
    <div className="rounded-2xl bg-white border border-[#1C1A16]/8 p-6 space-y-4">
      {children}
    </div>
  );
}

export function PageSkeleton({ variant = 'form' }: PageSkeletonProps) {
  return (
    <div className="min-h-[70vh] bg-[#FAF9F6] px-4 py-8 sm:px-6 lg:px-8">
      {/* 骨架动画自带样式：不动 globals.css，随组件按需注入 */}
      <style>{`
        @keyframes cf-shimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
        .cf-shimmer {
          background: linear-gradient(90deg, #F0EDE8 25%, #F7F5F1 50%, #F0EDE8 75%);
          background-size: 200% 100%;
          animation: cf-shimmer 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cf-shimmer { animation: none; background: #F0EDE8; }
        }
      `}</style>

      {/* 版心用 max-w-page（840px 单一真源）：与真实页面等宽，内容到达时几乎无位移 */}
      <div className="mx-auto w-full max-w-page space-y-4 md:space-y-6" role="status" aria-label="页面加载中">
        {/* 页头占位：设计系统 §7 标题区统一居中（H1 + mt-3 副标题） */}
        <div className="space-y-3 pt-2">
          <Bar className="h-8 w-2/5 mx-auto" />
          <Bar className="h-4 w-3/5 mx-auto" />
        </div>

        {variant === 'form' ? (
          <>
            {/* 表单卡：几行「标签 + 输入框」+ 提交按钮 */}
            <CardShell>
              <Bar className="h-4 w-1/4" />
              <Bar className="h-11 w-full" />
              <Bar className="h-4 w-1/4" />
              <Bar className="h-11 w-full" />
              <Bar className="h-4 w-1/3" />
              <Bar className="h-11 w-full" />
              {/* 主按钮占位：设计系统 §5 主按钮为整宽 rounded-lg（对齐 tarot/bazi 的 h-[54px] 提交钮） */}
              <Bar className="h-[54px] w-full" />
            </CardShell>
            {/* 页脚说明区占位 */}
            <CardShell>
              <Bar className="h-4 w-1/3" />
              <Bar className="h-4 w-full" />
              <Bar className="h-4 w-5/6" />
            </CardShell>
          </>
        ) : (
          <>
            {/* 内容卡 × 3：模拟结果页多段落长文 */}
            <CardShell>
              <Bar className="h-5 w-1/3" />
              <Bar className="h-4 w-full" />
              <Bar className="h-4 w-11/12" />
              <Bar className="h-4 w-4/6" />
            </CardShell>
            <CardShell>
              <Bar className="h-5 w-1/4" />
              <Bar className="h-4 w-full" />
              <Bar className="h-4 w-5/6" />
            </CardShell>
            <CardShell>
              <Bar className="h-5 w-2/5" />
              <Bar className="h-4 w-full" />
              <Bar className="h-4 w-3/4" />
            </CardShell>
          </>
        )}
      </div>
    </div>
  );
}
