'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<'unknown' | 'login' | 'register'>('unknown');
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailBlur = async () => {
    if (!email) return;
    setChecking(true);
    setError('');
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setMode(data.exists ? 'login' : 'register');
    } catch {
      // 网络失败时不阻断流程，保持 unknown
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('两次密码不一致');
        return;
      }
      setLoading(true);
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
      // 注册成功后自动登录
    }

    setLoading(true);
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setError('邮箱或密码错误');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-cyber-bg border border-cyber-gold/20 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-cyber-gold/60 transition-colors';

  return (
    <div className="min-h-screen bg-gradient-cyber flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🔮</span>
          <h1 className="font-heading text-2xl font-bold text-cyber-gold mt-3">
            {mode === 'register' ? '创建账号' : '欢迎回来'}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {mode === 'register' ? '注册赛博命理师，开启命理之旅' : '登录赛博命理师'}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">邮箱</label>
              <input
                type="email"
                className={inputClass}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setMode('unknown'); }}
                onBlur={handleEmailBlur}
                required
              />
              {checking && (
                <p className="text-xs text-text-muted mt-1">正在验证邮箱...</p>
              )}
              {!checking && mode === 'login' && (
                <p className="text-xs text-cyber-gold/70 mt-1">该邮箱已注册，请输入密码登录</p>
              )}
              {!checking && mode === 'register' && (
                <p className="text-xs text-green-400/70 mt-1">该邮箱未注册，将为您创建新账号</p>
              )}
            </div>

            {mode !== 'unknown' && (
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">密码</label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="至少 8 位"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">确认密码</label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {mode !== 'unknown' && (
              <Button
                type="submit"
                className="w-full"
                loading={loading}
              >
                {mode === 'register' ? '注册并登录' : '登录'}
              </Button>
            )}

            {mode === 'unknown' && (
              <Button
                type="button"
                className="w-full"
                loading={checking}
                onClick={handleEmailBlur}
              >
                继续
              </Button>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
