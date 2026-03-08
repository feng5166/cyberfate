'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AuthLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'unknown' | 'login' | 'register'>('unknown');
  const [checking, setChecking] = useState(false);

  const inputClass =
    'w-full px-4 py-3 bg-cyber-bg border border-cyber-gold/20 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-cyber-gold/60 transition-colors';

  const handleGoogle = async () => {
    if (!agreed) {
      setError('请先阅读并同意用户协议和隐私政策');
      return;
    }
    setGoogleLoading(true);
    await signIn('google', { callbackUrl });
  };

  const handleEmailBlur = async () => {
    if (!email) return;
    setChecking(true);
    setError('');
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setMode(data.exists ? 'login' : 'register');
    } catch {
      // 网络失败时不阻断流程
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('请先阅读并同意用户协议和隐私政策');
      return;
    }
    setError('');

    if (mode === 'register') {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || '注册失败');
          setLoading(false);
          return;
        }
      } catch {
        setError('注册失败，请重试');
        setLoading(false);
        return;
      }
    } else {
      setLoading(true);
    }

    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      setError('邮箱或密码错误');
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cyber flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🔮</span>
          <h1 className="font-heading text-2xl font-bold text-cyber-gold mt-3">登录 / 注册</h1>
          <p className="text-text-muted text-sm mt-1">登录或创建账号以继续使用</p>
        </div>

        <Card>
          {/* Google 登录（主要方式） */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-800 rounded-lg transition-colors disabled:opacity-50 mb-6 font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? '跳转中...' : '使用谷歌账号登录'}
          </button>

          {/* 分隔线 */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cyber-gold/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-cyber-card text-text-muted">或使用邮箱登录</span>
            </div>
          </div>

          {/* 邮箱表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">邮箱</label>
              <input
                type="email"
                className={inputClass}
                placeholder="example@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setMode('unknown'); }}
                onBlur={handleEmailBlur}
                required
              />
              {checking && <p className="text-xs text-text-muted mt-1">正在验证邮箱...</p>}
              {!checking && mode === 'login' && (
                <p className="text-xs text-cyber-gold/70 mt-1">该邮箱已注册，请输入密码登录</p>
              )}
              {!checking && mode === 'register' && (
                <p className="text-xs text-green-400/70 mt-1">该邮箱未注册，将为您创建新账号</p>
              )}
            </div>

            {mode !== 'unknown' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm text-text-secondary">密码</label>
                  <span className="text-xs text-text-muted">至少 8 个字符</span>
                </div>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="至少 8 个字符"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            )}

            {/* 用户协议 */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-cyber-gold"
              />
              <span className="text-xs text-text-muted leading-relaxed">
                我已阅读并同意{' '}
                <a href="/terms" target="_blank" className="text-cyber-gold hover:underline">用户协议</a>
                {' '}和{' '}
                <a href="/privacy" target="_blank" className="text-cyber-gold hover:underline">隐私政策</a>
              </span>
            </label>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {mode === 'unknown' ? (
              <Button
                type="button"
                className="w-full"
                loading={checking}
                onClick={handleEmailBlur}
              >
                继续
              </Button>
            ) : (
              <Button type="submit" className="w-full" loading={loading}>
                {mode === 'register' ? '注册并登录' : '登录'}
              </Button>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
