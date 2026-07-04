'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Users, Home, HeartHandshake, Check, HeartPulse, Loader2, ScrollText, RefreshCw } from 'lucide-react';
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
  deepReport?: string;
  _source?: string;
}

interface AIAnalysisSectionProps {
  payload: any;
  totalScore: number;
  initialData?: AIAnalysisData | null;
  onAnalysisDone?: (data: AIAnalysisData) => void;
}

export function AIAnalysisSection({ payload, totalScore, initialData, onAnalysisDone }: AIAnalysisSectionProps) {
  const [loading, setLoading] = useState(false);
  const [deepReportLoading, setDeepReportLoading] = useState(false);
  const [deepReportError, setDeepReportError] = useState('');
  const [error, setError] = useState('');
  const [data, setData] = useState<AIAnalysisData | null>(() => {
    if (!initialData) return null;
    return { ...initialData, _source: initialData._source ?? 'local-cache' };
  });
  const prevPayloadRef = useRef<string>('');
  const parsedRef = useRef<AIAnalysisData | null>(initialData ?? null);

  useEffect(() => {
    const key = JSON.stringify(payload);
    if (prevPayloadRef.current && prevPayloadRef.current !== key) {
      // payload 变了（用户重新提交了新数据），清空旧 AI 结果
      setData(null);
      setError('');
    }
    prevPayloadRef.current = key;
  }, [payload]);

  const fetchDeepReport = async () => {
    setDeepReportLoading(true);
    try {
      const res = await fetch('/api/bazi/marriage?ai=deep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '');
        console.error('[deepReport] fetch failed:', res.status, errText.slice(0, 200));
        setDeepReportError(`请求失败 (${res.status}): ${errText.slice(0, 80)}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          try {
            const json = JSON.parse(data);
            const delta = json.delta || '';
            if (delta) {
              accumulated += delta;
              setData(prev => prev ? { ...prev, deepReport: accumulated } : prev);
            }
          } catch { /* ignore */ }
        }
      }
      if (accumulated && parsedRef.current) {
        const next: AIAnalysisData = { ...parsedRef.current, deepReport: accumulated };
        parsedRef.current = next;
        onAnalysisDone?.(next);
      }
    } catch (e) {
      console.error('[deepReport] stream error:', e);
      setDeepReportError(String(e instanceof Error ? e.message : e));
    } finally {
      setDeepReportLoading(false);
    }
  };

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    // 第一步：结构化分析（约 10s）
    let parsed: AIAnalysisData;
    try {
      const res = await fetch('/api/bazi/marriage?ai=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || j.message || `AI 分析失败 (${res.status})`);
      }
      const j = await res.json();
      parsed = {
        score: j.score,
        dimensions: Array.isArray(j.dimensions) ? j.dimensions : [],
        advices: Array.isArray(j.advices) ? j.advices : [],
        highlight: typeof j.highlight === 'string' ? j.highlight : '',
        deepReport: '',
        _source: typeof j._source === 'string' ? j._source : undefined,
      };
      parsedRef.current = parsed;
      setData(parsed);
      onAnalysisDone?.(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
      setLoading(false);
      return;
    }

    // 第二步：streaming 深度命理报告 — 失败静默，不影响主分析
    await fetchDeepReport();
    setLoading(false);
  };

  const handleDeepReport = async () => {
    if (deepReportLoading) return;
    // 缓存恢复时 parsedRef 可能为 null，用 data 补充
    if (!parsedRef.current && data) {
      parsedRef.current = data;
    }
    await fetchDeepReport();
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
          <p className="text-[11px] text-brand-gray">
            首次解读约需 5-15 秒，结果会缓存以便复用
          </p>
        </div>
      )}

      {data && (
        <div className="space-y-5">
          {data._source && (
            <div className="flex justify-end mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#1C1A16]/10 bg-[#FAF9F6] text-[11px] text-[#1C1A16]/50">
                {data._source === 'local-cache' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1C1A16]/30 shrink-0" />
                    本地缓存
                  </>
                )}
                {data._source === 'cache' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />
                    服务端缓存
                  </>
                )}
                {(data._source === 'deepseek' || data._source === 'deepseek-fallback') && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1C1A16] shrink-0" />
                    DeepSeek
                  </>
                )}
              </span>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => setData(null)}
              className="flex items-center gap-1.5 text-xs text-brand-gray hover:text-brand-accent transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              重新分析
            </button>
          </div>
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
                    <div className="flex items-center gap-2.5 mb-4">
                      <span className="w-9 h-9 rounded-full bg-[#F6F4F1] border border-[#1C1A16]/20 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-[#1C1A16]" />
                      </span>
                      <h4
                        className="text-base md:text-lg font-medium text-[#1C1A16]"
                        style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif' }}
                      >
                        {dim.title}
                      </h4>
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
                <span className="w-8 h-8 rounded-full bg-[#F6F4F1] border border-[#1C1A16]/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#1C1A16]" />
                </span>
                <h4 className="text-base md:text-lg font-semibold text-[#1C1A16]">相处建议</h4>
              </div>
              <ul className="space-y-3">
                {data.advices.map((advice, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F6F4F1] border border-[#1C1A16]/25 text-xs font-semibold text-[#1C1A16]">
                      {i + 1}
                    </span>
                    <p className="text-sm text-[#1C1A16]/85 leading-relaxed">{advice}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.highlight && (
            <div className="rounded-2xl bg-[#F6F4F1] border-l-4 border-[#1C1A16] border-y border-r border-y-[#1C1A16]/15 border-r-[#1C1A16]/15 p-5 md:p-6">
              <div className="flex items-start gap-3">
                <HeartPulse className="w-5 h-5 text-[#1C1A16] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-[#1C1A16] font-medium tracking-wider mb-1.5">亮点总结</p>
                  <p className="text-sm md:text-base text-[#1C1A16]/85 leading-7">{data.highlight}</p>
                </div>
              </div>
            </div>
          )}

          {!data.deepReport && deepReportLoading && (
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 flex items-center justify-center gap-2 text-sm text-[#1C1A16]/55">
              <Loader2 className="w-4 h-4 animate-spin text-[#1C1A16]" />
              深度命理报告生成中…
            </div>
          )}

          {!data.deepReport && !deepReportLoading && (
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-[#1C1A16]/60">
                  <ScrollText className="w-4 h-4 text-[#1C1A16]/30" />
                  深度命理报告尚未生成
                </div>
                <button
                  type="button"
                  onClick={handleDeepReport}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#F6F4F1] border border-[#1C1A16]/20 px-3 py-1.5 text-xs text-[#1C1A16] hover:bg-[#F5EAD8] transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  生成报告
                </button>
              </div>
              {deepReportError && (
                <p className="text-xs text-[#B42318]">{deepReportError}</p>
              )}
            </div>
          )}

          {data.deepReport && (
            <div className="rounded-2xl border border-[#E5E0D8] bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF9F6]">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#F6F4F1] border border-[#1C1A16]/20 flex items-center justify-center">
                    <ScrollText className="w-3.5 h-3.5 text-[#1C1A16]" />
                  </span>
                  <h4 className="text-base font-semibold text-[#1C1A16]">深度命理报告</h4>
                </div>
              </div>
              <div className="px-5 md:px-8 py-6">
                {data.deepReport.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <div key={i} className="h-3" />;
                  // 章节标题：一、二、三、四、五、
                  if (/^[一二三四五六七八九十]、/.test(trimmed)) {
                    return (
                      <h4 key={i} className="text-base font-semibold text-[#1C1A16] mt-6 mb-3 first:mt-0">
                        {trimmed}
                      </h4>
                    );
                  }
                  // 建议格式：去掉 "a. 建议一：" 前缀，第一个句号/冒号前的内容加粗
                  const adviceMatch = trimmed.match(/^[a-dA-D]\.\s*(?:建议[一二三四])?\s*[：:]\s*(.+)/);
                  if (adviceMatch) {
                    const rest = adviceMatch[1];
                    // 找第一个句号或逗号作为标题结束
                    const sepIdx = rest.search(/[。，,]/);
                    const titleEnd = sepIdx > 0 && sepIdx <= 15 ? sepIdx : Math.min(rest.length, 12);
                    const title = rest.slice(0, titleEnd);
                    const body = rest.slice(titleEnd).replace(/^[。，,]/, '').trim();
                    return (
                      <div key={i} className="mb-4">
                        <span className="text-sm font-semibold text-[#1C1A16]">{title}</span>
                        {body && <span className="text-sm text-[#1C1A16]/80 leading-7">。{body}</span>}
                      </div>
                    );
                  }
                  if (/^[0-9]+\.\s/.test(trimmed)) {
                    return (
                      <p key={i} className="text-sm text-[#1C1A16]/80 leading-7 mb-2">
                        {trimmed}
                      </p>
                    );
                  }
                  if (/^(当前|流年|未来|具体建议|实用建议)/.test(trimmed)) {
                    return (
                      <p key={i} className="text-sm font-medium text-[#1C1A16]/70 leading-7 mb-1">
                        {trimmed}
                      </p>
                    );
                  }
                  if (trimmed.startsWith('·')) {
                    return (
                      <p key={i} className="text-sm text-[#1C1A16]/80 leading-7 pl-4 relative mb-1.5 before:content-['·'] before:absolute before:left-0 before:text-[#1C1A16]">
                        {trimmed.slice(1).trim()}
                      </p>
                    );
                  }
                  if (/^[1-9]\.\s/.test(trimmed)) {
                    return (
                      <p key={i} className="text-sm text-[#1C1A16]/80 leading-7 mb-2">
                        {trimmed}
                      </p>
                    );
                  }
                  return (
                    <p key={i} className="text-sm text-[#1C1A16]/80 leading-7 mb-3">
                      {trimmed}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
