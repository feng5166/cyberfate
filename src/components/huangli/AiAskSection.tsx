'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Sparkles } from 'lucide-react';
import { OracleLoading } from '@/components/ui/OracleLoading';
import { useAiGate, AiGateModals } from '@/components/ai/useAiGate';

interface AiAskSectionProps {
  date: string;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  streaming?: boolean;
}

const PRESET_QUESTIONS = [
  '今天适合签约吗？',
  '今天适合出行吗？',
  '今天适合求婚吗？',
  '今天开市好不好？',
  '今天适合装修吗？',
  '今天适合搬家吗？',
];

export function AiAskSection({ date }: AiAskSectionProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { status } = useSession();
  const gate = useAiGate(status === 'authenticated');

  const sendQuestion = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    let aiIndex = -1;

    try {
      const res = await fetch('/api/huangli/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, date }),
      });

      if (!res.ok || !res.body) {
        let errMsg = 'AI 思考较久，请稍后再试。';
        let data: { message?: string; error?: string; code?: string } = {};
        try {
          data = await res.json();
          // 优先服务端友好文案（如「今日免费次数已用完，升级 VIP 不限量」「请先登录」）
          if (data?.message || data?.error) errMsg = data.message || data.error || errMsg;
        } catch {}
        // 命中统一门禁（游客弹登录 / 未订阅弹升级）：弹窗后中止，不再 push 笼统报错
        if (gate.handle(res.status, data?.code || data?.error)) {
          setLoading(false);
          return;
        }
        setMessages((prev) => [...prev, { role: 'ai', content: errMsg }]);
        return;
      }

      setMessages((prev) => {
        aiIndex = prev.length;
        return [...prev, { role: 'ai', content: '', streaming: true }];
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;
          const data = trimmedLine.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            if (json.content) {
              acc += json.content;
              setMessages((prev) => {
                const next = [...prev];
                if (aiIndex >= 0 && next[aiIndex]) {
                  next[aiIndex] = { ...next[aiIndex], content: acc };
                }
                return next;
              });
            }
          } catch {}
        }
      }

      setMessages((prev) => {
        const next = [...prev];
        if (aiIndex >= 0 && next[aiIndex]) {
          next[aiIndex] = { ...next[aiIndex], streaming: false };
        }
        return next;
      });
    } catch {
      setMessages((prev) => {
        if (aiIndex >= 0 && prev[aiIndex]) {
          const next = [...prev];
          next[aiIndex] = { role: 'ai', content: '网络错误，请稍后再试。', streaming: false };
          return next;
        }
        return [...prev, { role: 'ai', content: '网络错误，请稍后再试。' }];
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(input);
  };

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#1C1A16]/8">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: '#FEE2E2' }}
        >
          <Sparkles className="w-4.5 h-4.5" strokeWidth={1.5} style={{ color: '#DC2626' }} />
        </div>
        <h3 className="font-display text-lg font-semibold text-[#1C1A16]">
          AI老黄历助手
        </h3>
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-[0.08em]"
          style={{ background: '#FEE2E2', color: '#DC2626' }}
        >
          智能问事
        </span>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4 md:overflow-visible overflow-x-auto">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendQuestion(q)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm bg-[#FAF9F6] text-[#1C1A16]/70 border border-[#1C1A16]/10 hover:border-[#1C1A16]/30 hover:text-[#1C1A16] transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto" aria-live="polite">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-accent-tint text-[#1C1A16] ml-8 border border-brand-accent/20'
                  : 'bg-[#FAF9F6] text-[#1C1A16]/80 mr-8 border border-[#1C1A16]/6'
              }`}
            >
              {msg.role === 'ai' && msg.streaming && !msg.content ? (
                <OracleLoading />
              ) : (
                <span className="whitespace-pre-wrap">
                  {msg.content}
                  {msg.streaming && msg.content && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#1C1A16]/40 align-middle animate-pulse" />
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="今天适合搬家吗？"
          disabled={loading}
          className="flex-1 bg-white rounded-xl px-4 py-3 text-sm text-[#1C1A16] border border-[#1C1A16]/15 focus:ring-2 focus:ring-brand-accent/25 focus:border-brand-accent focus:outline-none transition-colors placeholder:text-[#1C1A16]/40 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          aria-label="发送问题"
          className="px-4 py-3 bg-brand-accent text-white rounded-xl hover:bg-brand-accent-hover transition-colors disabled:opacity-40 flex items-center gap-1"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {messages.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 overflow-x-auto">
          {PRESET_QUESTIONS.slice(0, 4).map((q) => (
            <button
              key={q}
              onClick={() => sendQuestion(q)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs bg-[#FAF9F6] text-[#1C1A16]/50 border border-[#1C1A16]/10 hover:text-[#1C1A16] hover:border-[#1C1A16]/30 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <AiGateModals gate={gate} callbackUrl="/huangli" />
    </div>
  );
}
