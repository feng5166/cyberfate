'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, History } from 'lucide-react';

interface HistoryRecord {
  id: string;
  date: string;
  summary: string | null;
  fullContent: string | null;
  generatedAt: string;
}

interface DailyDetailAnalysisProps {
  isLoggedIn: boolean;
  isVip: boolean;
  onLoginRequired: () => void;
  targetDate: string;
  hasBirthInfo: boolean;
}

type Status = 'idle' | 'loading' | 'done' | 'exhausted';

const LOADING_MESSAGES = [
  { time: 0, text: '正在为您调取今日命盘...' },
  { time: 3000, text: 'AI 正在结合八字与流年分析...' },
  { time: 8000, text: '正在生成专属解读...' },
];

export default function DailyDetailAnalysis({ isLoggedIn, isVip, onLoginRequired, targetDate, hasBirthInfo }: DailyDetailAnalysisProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [content, setContent] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0].text);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<HistoryRecord | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [historyHover, setHistoryHover] = useState(false);
  const [historyBtnHover, setHistoryBtnHover] = useState(false);
  const [hoveredRecordId, setHoveredRecordId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout[]>([]);

  // 检查是否今天已经生成过
  useEffect(() => {
    if (!isLoggedIn) return;
    checkTodayStatus();
  }, [isLoggedIn, targetDate]);

  const checkTodayStatus = async () => {
    try {
      const res = await fetch(`/api/daily/detail-history?limit=1`);
      if (!res.ok) return;
      const data = await res.json();
      const todayRecord = data.records?.find((r: HistoryRecord) => r.date === targetDate);
      if (todayRecord) {
        setContent(todayRecord.fullContent || '');
        setRecordId(todayRecord.id);
        if (!isVip) {
          setStatus('exhausted');
        } else {
          setStatus('done');
        }
      }
    } catch {}
  };

  const startLoadingMessages = () => {
    loadingTimerRef.current.forEach(t => clearTimeout(t));
    loadingTimerRef.current = [];
    setLoadingMsg(LOADING_MESSAGES[0].text);

    LOADING_MESSAGES.slice(1).forEach(({ time, text }) => {
      const timer = setTimeout(() => setLoadingMsg(text), time);
      loadingTimerRef.current.push(timer);
    });
  };

  const stopLoadingMessages = () => {
    loadingTimerRef.current.forEach(t => clearTimeout(t));
    loadingTimerRef.current = [];
  };

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    if (!hasBirthInfo) {
      alert('请先在个人中心填写出生信息');
      return;
    }

    setStatus('loading');
    setContent('');
    startLoadingMessages();

    try {
      const res = await fetch('/api/daily/detail-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: targetDate }),
      });

      if (res.status === 403) {
        const data = await res.json();
        if (data.code === 'DAILY_LIMIT_REACHED') {
          // 加载已有内容
          await checkTodayStatus();
          setStatus('exhausted');
          stopLoadingMessages();
          return;
        }
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '请求失败');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(trimmed.slice(6));
            if (json.content) {
              fullText += json.content;
              setContent(fullText);
              // 收到第一个 token 时隐藏 loading 文案
              if (fullText.length <= json.content.length) {
                stopLoadingMessages();
              }
            }
            if (json.done) {
              setRecordId(json.id);
              setStatus('done');
            }
            if (json.error) {
              throw new Error(json.error);
            }
          } catch (e: any) {
            if (e.message && e.message !== 'Unexpected end of JSON input') {
              console.warn('SSE parse error:', e);
            }
          }
        }
      }

      if (status !== 'done') setStatus('done');
    } catch (error: any) {
      console.error('Detail analysis error:', error);
      setStatus('idle');
      stopLoadingMessages();
      alert(error.message || '分析生成失败，请稍后重试');
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/daily/detail-history?limit=${isVip ? 20 : 3}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryRecords(data.records || []);
      }
    } catch {}
    setHistoryLoading(false);
  };

  const openHistory = () => {
    setShowHistory(true);
    fetchHistory();
  };

  // 渲染 Markdown 内容（简单实现）
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('## ')) {
        return <h2 key={i} style={{ fontSize: 18, fontWeight: 600, color: '#1C1A16', marginTop: i === 0 ? 0 : 24, marginBottom: 12, fontFamily: 'Noto Serif SC, serif' }}>{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} style={{ fontSize: 15, fontWeight: 600, color: '#1F2937', marginTop: 16, marginBottom: 8 }}>{line.slice(4)}</h3>;
      }
      if (line.startsWith('- ')) {
        return <p key={i} style={{ fontSize: 14, color: '#1C1A16', lineHeight: 1.8, paddingLeft: 16, position: 'relative' }}><span style={{ position: 'absolute', left: 0 }}>•</span>{line.slice(2)}</p>;
      }
      if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
      return <p key={i} style={{ fontSize: 14, color: 'rgba(28,26,22,0.8)', lineHeight: 1.8 }}>{line}</p>;
    });
  };

  return (
    <>
      {/* 入口卡片 - 黑白极简 */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '24px 28px', border: '1px solid #E5E7EB', position: 'relative' }}>
        {/* 历史按钮 - 右上角绝对定位方框 */}
        <button
          onClick={openHistory}
          onMouseEnter={() => setHistoryBtnHover(true)}
          onMouseLeave={() => setHistoryBtnHover(false)}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            backgroundColor: historyBtnHover ? '#F9FAFB' : '#FFFFFF',
            border: `1px solid ${historyBtnHover ? '#9CA3AF' : '#E5E7EB'}`,
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transition: 'all 0.15s',
          }}
          title="历史记录"
        >
          <History size={16} color="#6B7280" />
        </button>

        {/* idle 态 - 横向布局 */}
          {status === 'idle' && (
            <div className="ddap-idle-row" style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 200, paddingRight: 52 }}>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: '#111827', fontFamily: 'Noto Serif SC, serif', margin: 0 }}>
                  每日运势详细分析
                </h3>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, marginTop: 6, lineHeight: 1.5 }}>
                  基于八字命盘与今日干支，为你深度解析运势走向
                </p>
              </div>
              <button
                className="ddap-cta"
                onClick={handleGenerate}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#111827')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1F2937')}
                style={{
                  padding: '10px 28px',
                  backgroundColor: '#1F2937',
                  color: 'white',
                  borderRadius: 999,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background-color 0.15s',
                }}
              >
                开始分析
              </button>
            </div>
          )}

          {/* loading 态 */}
          {status === 'loading' && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#111827', fontFamily: 'Noto Serif SC, serif', margin: 0, marginBottom: 16 }}>
                每日运势详细分析
              </h3>
              {content ? (
                <div ref={contentRef} style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
                  {renderContent(content)}
                  <span className="animate-pulse" style={{ display: 'inline-block', width: 2, height: 16, backgroundColor: '#1F2937', marginLeft: 2, verticalAlign: 'middle' }} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div className="animate-pulse" style={{ fontSize: 14, color: 'rgba(28,26,22,0.6)' }}>
                    {loadingMsg}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} className="animate-bounce" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#1F2937', animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* done 态 */}
          {status === 'done' && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#111827', fontFamily: 'Noto Serif SC, serif', margin: 0, marginBottom: 16 }}>
                每日运势详细分析
              </h3>
              <div ref={contentRef} style={{ maxHeight: 500, overflowY: 'auto', paddingRight: 8 }}>
                {renderContent(content)}
              </div>
              {isVip && (
                <button
                  onClick={handleGenerate}
                  style={{
                    display: 'block',
                    margin: '16px auto 0',
                    width: 'auto',
                    padding: '10px 28px',
                    backgroundColor: 'transparent',
                    color: '#1F2937',
                    borderRadius: 999,
                    border: '1px solid #1F2937',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  重新生成
                </button>
              )}
            </div>
          )}

          {/* exhausted 态 */}
          {status === 'exhausted' && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#111827', fontFamily: 'Noto Serif SC, serif', margin: 0, marginBottom: 16 }}>
                每日运势详细分析
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ color: '#10B981', fontSize: 16 }}>✓</span>
                <span style={{ fontSize: 14, color: 'rgba(28,26,22,0.7)' }}>今日已为您生成详细解读</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setStatus('done'); }}
                  style={{ flex: 1, padding: '10px 0', backgroundColor: 'transparent', color: '#1C1A16', borderRadius: 999, border: '1px solid #E5E7EB', fontSize: 13, cursor: 'pointer' }}
                >
                  查看今日解读
                </button>
                <button
                  onClick={() => { window.location.href = '/pricing'; }}
                  style={{ flex: 1, padding: '10px 0', backgroundColor: '#1F2937', color: 'white', borderRadius: 999, border: 'none', fontSize: 13, cursor: 'pointer' }}
                >
                  升级 Pro 重新生成
                </button>
              </div>
            </div>
          )}
      </div>

      {/* 历史记录抽屉 */}
      {showHistory && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
          {/* 遮罩 */}
          <div
            onClick={() => { setShowHistory(false); setSelectedHistory(null); }}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }}
          />
          {/* 抽屉 */}
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '85%', maxWidth: 380, backgroundColor: '#FFFFFF', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', padding: 24, overflowY: 'auto', animation: 'slideInRight 0.25s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1C1A16' }}>历史解读</h3>
              <button onClick={() => { setShowHistory(false); setSelectedHistory(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} color="#6B7280" />
              </button>
            </div>

            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(28,26,22,0.5)' }}>加载中...</div>
            ) : selectedHistory ? (
              <div>
                <button onClick={() => setSelectedHistory(null)} style={{ fontSize: 13, color: '#1F2937', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0 }}>
                  ← 返回列表
                </button>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1C1A16', marginBottom: 12 }}>{selectedHistory.date}</div>
                <div>{renderContent(selectedHistory.fullContent || '')}</div>
              </div>
            ) : (
              <div>
                {historyRecords.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'rgba(28,26,22,0.5)', fontSize: 14 }}>暂无历史记录</div>
                ) : (
                  <>
                    {historyRecords.map(record => (
                      <button
                        key={record.id}
                        onClick={() => setSelectedHistory(record)}
                        onMouseEnter={() => setHoveredRecordId(record.id)}
                        onMouseLeave={() => setHoveredRecordId(null)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '14px 12px',
                          borderBottom: '1px solid #F3F4F6',
                          background: hoveredRecordId === record.id ? '#F9FAFB' : 'none',
                          border: 'none',
                          borderBottomWidth: 1,
                          borderBottomStyle: 'solid',
                          borderBottomColor: '#F3F4F6',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#1C1A16', marginBottom: 4 }}>{record.date}</div>
                        <div style={{ fontSize: 13, color: 'rgba(28,26,22,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {record.summary || '详细解读'}
                        </div>
                      </button>
                    ))}
                    {!isVip && historyRecords.length >= 3 && (
                      <div style={{ marginTop: 20, padding: 16, backgroundColor: '#FAF9F6', borderRadius: 12, textAlign: 'center' }}>
                        <p style={{ fontSize: 13, color: 'rgba(28,26,22,0.6)', marginBottom: 12 }}>仅 Pro 用户可查看更多历史</p>
                        <button
                          onClick={() => { window.location.href = '/pricing'; }}
                          style={{ padding: '8px 20px', backgroundColor: '#1F2937', color: 'white', borderRadius: 999, border: 'none', fontSize: 13, cursor: 'pointer' }}
                        >
                          升级 Pro 解锁全部历史
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 抽屉动画 CSS */}
      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* 响应式：移动端 idle 态改为竖排 */}
      <style jsx>{`
        @media (max-width: 767px) {
          :global(.ddap-idle-row) {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          :global(.ddap-cta) {
            width: 100% !important;
            border-radius: 8px !important;
            padding: 12px 0 !important;
          }
        }
      `}</style>
    </>
  );
}
