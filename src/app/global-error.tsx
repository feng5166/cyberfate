'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0f',
            color: '#e2e8f0',
            fontFamily: 'system-ui, sans-serif',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              出了点问题
            </h1>
            <p style={{ color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              服务器遇到了一个错误，请稍后重试。如果问题持续出现，请联系我们的支持团队。
            </p>
            {error.digest && (
              <p style={{ color: '#475569', fontSize: '0.75rem', margin: 0 }}>
                错误 ID：{error.digest}
              </p>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                重试
              </button>
              <a
                href="/"
                style={{
                  padding: '0.625rem 1.5rem',
                  background: '#1e293b',
                  color: '#e2e8f0',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  display: 'inline-block',
                }}
              >
                返回首页
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
