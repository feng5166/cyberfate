'use client';

import { useState, useRef, useCallback } from 'react';
import { History, Send, X } from 'lucide-react';

interface QAMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface HistoryRecord {
  id: string;
  question: string;
  answer: string | null;
  createdAt: string;
}

interface DailyFortuneQAProps {
  isLoggedIn: boolean;
  isVip: boolean;
  onLoginRequired: () => void;
  hasBirthInfo: boolean;
}

const PRESET_QUESTIONS = [
  '近期我的整体运势如何？',
  '最近适合我做什么事情？',
  '近期有哪些需要注意避开的事情？',
  '这个月我的财运怎么样？',
  '近期人际关系和社交运势如何？',
  '最近哪些日子比较适合做重要决定？',
];

export default function DailyFortuneQA({
  isLoggedIn,
  isVip,
  onLoginRequired,
  hasBirthInfo,
}: DailyFortuneQAProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchHistoryCount = useCallback(async () => {
    try {
      const res = await fetch('/api/daily/fortune-qa-history');
      if (res.ok) {
        const data = await res.json();
        setHistoryCount(data.count || 0);
      }
    } catch {}
  }, []);

  const handleSubmit = useCallback(async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || isLoading) return;

    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    if (!hasBirthInfo) {
      alert('请先在个人中心填写出生信息');
      return;
    }

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/daily/fortune-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      if (res.status === 429) {
        setLimitReached(true);
        setMessages(prev => [...prev, { role: 'assistant', content: '今日问答次数已用完，升级 Pro 无限提问 ✨' }]);
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessages(prev => [...prev, { role: 'assistant', content: err.message || '服务暂时不可用，请稍后再试' }]);
        setIsLoading(false);
        return;
      }

      // 流式读取
      const reader = res.body?.getReader();
      if (!reader) {
        setIsLoading(false);
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            if (json.content) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + json.content };
                }
                return updated;
              });
            }
          } catch {}
        }
      }

      setHistoryCount(prev => prev + 1);
      setTimeout(scrollToBottom, 100);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '网络错误，请稍后再试' }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isLoggedIn, hasBirthInfo, onLoginRequired, scrollToBottom]);

  const handlePresetClick = (q: string) => {
    handleSubmit(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const openHistory = async () => {
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/daily/fortune-qa-history');
      if (res.ok) {
        const data = await res.json();
        setHistoryRecords(data.records || []);
        setHistoryCount(data.count || 0);
      }
    } catch {}
    setHistoryLoading(false);
  };

  // 首次加载获取历史数量
  useState(() => {
    if (isLoggedIn) fetchHistoryCount();
  });

  return (
    <>
      <div style={{
        position: 'relative',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: '24px 28px',
      }}>
        {/* 标题区 */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{
            fontSize: 17,
            fontWeight: 600,
            color: '#111827',
            fontFamily: "'Noto Serif SC', serif",
            margin: 0,
          }}>
            AI 运势问答
          </h3>
          <p style={{
            fontSize: 13,
            color: '#9CA3AF',
            lineHeight: 1.6,
            marginTop: 6,
            margin: '6px 0 0',
          }}>
            基于您的八字和近期天干地支信息，AI 可以为您提供更全面的运势分析和建议
          </p>
        </div>

        {/* 右上角历史按钮 */}
        <button
          onClick={openHistory}
          style={{
            position: 'absolute',
            top: 24,
            right: 28,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#9CA3AF';
            e.currentTarget.style.backgroundColor = '#F9FAFB';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#E5E7EB';
            e.currentTarget.style.backgroundColor = '#FFFFFF';
          }}
          aria-label="查看历史问答"
        >
          <History size={16} color="#6B7280" />
          {historyCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -6,
              right: -6,
              minWidth: 18,
              height: 18,
              padding: '0 5px',
              borderRadius: 999,
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {historyCount > 99 ? '99+' : historyCount}
            </span>
          )}
        </button>

        {/* 对话区 */}
        {messages.length > 0 && (
          <div style={{
            maxHeight: 400,
            overflowY: 'auto',
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: msg.role === 'user' ? '#F3F4F6' : '#FFFFFF',
                  border: msg.role === 'assistant' ? '1px solid #E5E7EB' : 'none',
                  fontSize: 14,
                  color: '#374151',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.role === 'user' && <span style={{ fontSize: 12, color: '#9CA3AF', display: 'block', marginBottom: 4 }}>你问：</span>}
                  {msg.content}
                  {msg.role === 'assistant' && isLoading && i === messages.length - 1 && (
                    <span style={{ display: 'inline-block', width: 6, height: 14, backgroundColor: '#1F2937', marginLeft: 2, animation: 'blink 1s infinite' }} />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* 输入区 */}
        <div className="fortune-qa-input-area" style={{
          display: 'flex',
          gap: 12,
          marginBottom: messages.length === 0 ? 0 : 0,
        }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入您的问题，例如：近期我的整体运势如何？最近适合做什么事情？"
            disabled={isLoading || limitReached}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#9CA3AF'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isLoading || limitReached}
            style={{
              padding: '12px 24px',
              backgroundColor: (!input.trim() || isLoading || limitReached) ? '#D1D5DB' : '#6B7280',
              color: '#FFFFFF',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              border: 'none',
              cursor: (!input.trim() || isLoading || limitReached) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background-color 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              if (input.trim() && !isLoading && !limitReached) e.currentTarget.style.backgroundColor = '#4B5563';
            }}
            onMouseLeave={e => {
              if (input.trim() && !isLoading && !limitReached) e.currentTarget.style.backgroundColor = '#6B7280';
            }}
          >
            <Send size={15} />
            提问
          </button>
        </div>

        {/* 预设问题区 */}
        {messages.length === 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 12px' }}>
              您可以询问以下方面的问题：
            </p>
            <div className="fortune-qa-presets" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}>
              {PRESET_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handlePresetClick(q)}
                  disabled={isLoading}
                  style={{
                    padding: '14px 16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    textAlign: 'left',
                    fontSize: 14,
                    color: '#374151',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#9CA3AF';
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  <Send size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 限频提示 */}
        {limitReached && !isVip && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            backgroundColor: '#FEF3C7',
            borderRadius: 8,
            fontSize: 13,
            color: '#92400E',
            textAlign: 'center',
          }}>
            今日问答次数已用完，<a href="/pricing" style={{ color: '#D97706', fontWeight: 500, textDecoration: 'underline' }}>升级 Pro</a> 无限提问 ✨
          </div>
        )}
      </div>

      {/* 历史抽屉 */}
      {showHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#FFFFFF',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* 抽屉头 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
              问答历史（{historyCount}）
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              aria-label="关闭历史"
            >
              <X size={20} color="#6B7280" />
            </button>
          </div>

          {/* 抽屉内容 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            {historyLoading ? (
              <p style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 40 }}>加载中...</p>
            ) : historyRecords.length === 0 ? (
              <p style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 40 }}>暂无历史记录</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {historyRecords.map(record => (
                  <div key={record.id} style={{
                    padding: '14px 16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 6 }}>
                      {record.question}
                    </div>
                    {record.answer && (
                      <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {record.answer.length > 100 ? record.answer.slice(0, 100) + '...' : record.answer}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                ))}
                {!isVip && historyCount > 3 && (
                  <div style={{
                    padding: '14px 16px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: 10,
                    textAlign: 'center',
                    fontSize: 13,
                    color: '#6B7280',
                  }}>
                    升级 Pro 查看全部 {historyCount} 条记录
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 遮罩 */}
      {showHistory && (
        <div
          onClick={() => setShowHistory(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 999,
          }}
        />
      )}

      {/* 光标闪烁动画 */}
      <style jsx global>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @media (max-width: 768px) {
          .fortune-qa-input-area {
            flex-direction: column !important;
          }
          .fortune-qa-input-area button {
            width: 100% !important;
            justify-content: center !important;
          }
          .fortune-qa-presets {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
