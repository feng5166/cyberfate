'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { useAiGate, AiGateModals } from '@/components/ai/useAiGate';

interface AIQASectionProps {
  maleBazi: string;
  femaleBazi: string;
  maleName: string;
  femaleName: string;
  score: number;
  level: string;
}

interface QAEntry {
  question: string;
  answer: string;
  pending?: boolean;
  error?: string;
}

const PRESET_QUESTIONS = [
  '婚姻质量和持久度如何',
  '双方性格匹配度',
  '事业发展互补性',
  '子女缘分如何',
  '财运配合度',
  '家庭关系处理',
  '婚后哪些方面要特别注意',
  '何时进入感情稳定期',
];

export function AIQASection({
  maleBazi,
  femaleBazi,
  maleName,
  femaleName,
  score,
  level,
}: AIQASectionProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QAEntry[]>([]);

  const { status } = useSession();
  const gate = useAiGate(status === 'authenticated');

  const submit = async (questionText?: string) => {
    const q = (questionText ?? input).trim();
    if (!q || loading) return;

    setLoading(true);
    setInput('');

    const placeholder: QAEntry = { question: q, answer: '', pending: true };
    setHistory((prev) => [...prev, placeholder]);

    try {
      const res = await fetch('/api/bazi/marriage/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          maleBazi,
          femaleBazi,
          maleName,
          femaleName,
          score,
          level,
          history: history.flatMap((h) => [
            { role: 'user' as const, content: h.question },
            { role: 'assistant' as const, content: h.answer || '' },
          ]),
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        // 统一 AI 门禁：游客被拦→弹登录，登录未订阅被配额拦→弹升级
        if (gate.handle(res.status, j.code || j.error)) {
          // 命中门禁：移除占位的 pending 条目并重置加载态，不在气泡里显示报错文字
          setHistory((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.pending) next.pop();
            return next;
          });
          setLoading(false);
          return;
        }
        // 优先显示服务端友好文案（如「今日免费问答次数已用完，升级 VIP 不限量」）
        throw new Error(j.message || j.error || '请求失败');
      }
      const j = await res.json();
      setHistory((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.pending) {
          next[next.length - 1] = { question: q, answer: String(j.answer || '') };
        }
        return next;
      });
    } catch (e) {
      setHistory((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.pending) {
          next[next.length - 1] = {
            question: q,
            answer: '',
            error: e instanceof Error ? e.message : '未知错误',
          };
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 md:p-8">
      <div className="text-center mb-6">

        <h3
          className="text-2xl md:text-3xl font-semibold text-[#1C1A16]"
          style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif' }}
        >
          AI 问答
        </h3>
        <p className="text-sm text-[#1C1A16]/60 mt-2">
          针对双方八字提出具体问题，获取专业解答
        </p>
      </div>

      {history.length > 0 && (
        <div className="space-y-4 mb-5">
          {history.map((h, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-start gap-2 justify-end">
                <div className="rounded-2xl bg-[#FAF3EC] border border-[#C2762B]/15 px-4 py-2.5 max-w-[85%]">
                  <p className="text-sm text-[#1C1A16] leading-relaxed">{h.question}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="rounded-2xl bg-[#FAF9F6] border border-[#E5E0D8] px-4 py-3 max-w-[90%]">
                  {h.pending ? (
                    <div className="flex items-center gap-2 text-xs text-[#1C1A16]/55">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C2762B]" />
                      命理师正在解读…
                    </div>
                  ) : h.error ? (
                    <p className="text-xs text-[#B42318]">{h.error}</p>
                  ) : (
                    <p className="text-sm text-[#1C1A16]/85 leading-7 whitespace-pre-wrap">
                      {h.answer}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="输入你的问题，例如：婚姻质量如何？"
          disabled={loading}
          className="flex-1 h-11 rounded-lg border border-[#E5E0D8] bg-white px-4 text-sm text-[#1C1A16] placeholder:text-[#1C1A16]/40 focus:border-[#C2762B] focus:ring-2 focus:ring-[#C2762B]/15 outline-none transition-all"
        />
        <button
          type="button"
          onClick={() => submit()}
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed px-4 h-11 text-sm font-medium text-white transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          提问
        </button>
      </div>

      <div className="mt-4">
        <p className="text-xs text-[#1C1A16]/55 mb-2">快捷问题：</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => submit(q)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-[#E5E0D8] bg-white hover:bg-[#FAF9F6] hover:border-[#C2762B]/40 text-[#1C1A16]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <AiGateModals gate={gate} callbackUrl="/bazi/marriage" />
    </div>
  );
}
