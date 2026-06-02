'use client';

import { useState } from 'react';
import { Sparkles, Users, Home, HeartHandshake, Check, HeartPulse, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Dimension {
  key: string;
  title: string;
  score: number;
  content: string;
}

interface AIAnalysisData {
  score?: number;
  dimensions: Dimension[];
  advices: string[];
  highlight: string;
}

interface AIAnalysisSectionProps {
  payload: any;
  totalScore: number;
}

export function AIAnalysisSection({ payload, totalScore }: AIAnalysisSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<AIAnalysisData | null>(null);

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bazi/marriage?ai=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || j.message || 'AI 分析失败');
      }
      const j = await res.json();
      setData({
        score: j.score,
        dimensions: Array.isArray(j.dimensions) ? j.dimensions : [],
        advices: Array.isArray(j.advices) ? j.advices : [],
        highlight: typeof j.highlight === 'string' ? j.highlight : '',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const iconMap: Record<string, any> = {
    basic: Sparkles,
    personality: Users,
    palace: Home,
    family: HeartHandshake,
  };

  return (
    <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 md:p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1C1A16]/10 bg-[#FAF9F6] text-xs text-[#1C1A16]/70 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#C2762B]" />
          <span>AI 深度解读</span>
        </div>
        <h3
          className="text-2xl md:text-3xl font-semibold text-[#1C1A16]"
          style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif' }}
        >
          AI 合婚分析
        </h3>
        <p className="text-sm text-[#1C1A16]/60 mt-2">
          使用 AI 技术对双方八字进行深度解析
        </p>
      </div>

      {!data && (
        <div className="flex flex-col items-center gap-3">
          <Button
            onClick={handleStart}
            size="lg"
            loading={loading}
            disabled={loading}
            className="px-8"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                AI 正在解析…
              </>
            ) : (
              '开始 AI 分析'
            )}
          </Button>
          {error && (
            <p className="text-xs text-[#B42318]">{error}</p>
          )}
          <p className="text-[11px] text-[#1C1A16]/40">
            首次解读约需 5-15 秒，结果会缓存以便复用
          </p>
        </div>
      )}

      {data && (
        <div className="space-y-5">
          {data.dimensions.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {data.dimensions.map((dim, idx) => {
                const Icon = iconMap[dim.key] || Sparkles;
                const dimScore = Math.max(0, Math.min(100, Number(dim.score) || 0));
                const altBg = idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]';
                return (
                  <div
                    key={dim.key || idx}
                    className={`rounded-2xl border border-[#E5E0D8] ${altBg} p-5 md:p-6`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-full bg-[#FAF3EC] border border-[#C2762B]/20 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-[#C2762B]" />
                        </span>
                        <h4
                          className="text-base md:text-lg font-medium text-[#1C1A16]"
                          style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif' }}
                        >
                          {dim.title}
                        </h4>
                      </div>
                      <span className="text-sm font-semibold text-[#C2762B] tabular-nums">
                        {dimScore}
                        <span className="text-xs text-[#1C1A16]/40 font-normal">/100</span>
                      </span>
                    </div>
                    <div className="mb-4">
                      <div className="h-1.5 w-full rounded-full bg-[#E5E0D8] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#C2762B] transition-all duration-700 ease-out"
                          style={{ width: `${dimScore}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-[#1C1A16]/80 leading-7 whitespace-pre-wrap">
                      {dim.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {data.advices.length > 0 && (
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-full bg-[#FAF3EC] border border-[#C2762B]/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#C2762B]" />
                </span>
                <h4 className="text-base md:text-lg font-semibold text-[#1C1A16]">相处建议</h4>
              </div>
              <ul className="space-y-3">
                {data.advices.map((advice, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FAF3EC] border border-[#C2762B]/25 text-xs font-semibold text-[#C2762B]">
                      {i + 1}
                    </span>
                    <p className="text-sm text-[#1C1A16]/85 leading-relaxed">{advice}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.highlight && (
            <div className="rounded-2xl bg-[#FAF3EC] border-l-4 border-[#C2762B] border-y border-r border-y-[#C2762B]/15 border-r-[#C2762B]/15 p-5 md:p-6">
              <div className="flex items-start gap-3">
                <HeartPulse className="w-5 h-5 text-[#C2762B] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-[#C2762B] font-medium tracking-wider mb-1.5">亮点总结</p>
                  <p className="text-sm md:text-base text-[#1C1A16]/85 leading-7">{data.highlight}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
