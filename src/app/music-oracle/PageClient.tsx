'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAiGate, AiGateModals } from '@/components/ai/useAiGate';
import { Container } from '@/components/ui/Container';
import { Footer } from '@/components/layout/Footer';
import { OracleLoading } from '@/components/ui/OracleLoading';
import { Share2, RefreshCw, ChevronDown, ChevronUp, Sparkles, ExternalLink } from 'lucide-react';
import { toPng } from 'html-to-image';
import { wuxingColor } from '@/data/wuxing';

/* ─── 五行封面：图标为装饰 emoji，底色统一取自 @/data/wuxing 单一真源 ─── */
const WUXING_ICONS: Record<string, string> = {
  木: '🌿', 火: '🔥', 土: '🏔', 金: '✨', 水: '💧',
};

/** 取五行封面样式：底色来自 wuxing 真源，禁止在组件内手写每个元素的色值 */
function wuxingCover(cn: string) {
  return { bg: wuxingColor(cn).bg, icon: WUXING_ICONS[cn] || WUXING_ICONS['木'] };
}

/* ─── 快捷话题标签 ─── */
const QUICK_TAGS = ['感情', '事业', '财运', '人际', '健康'];

/* ─── FAQ ─── */
const FAQ_LIST = [
  {
    q: '音乐运势签是怎么推荐歌曲的？',
    a: '系统结合你的问题关键词、今日天干五行、以及你出生年份对应的日主五行（可选），通过三重匹配确定情绪色彩，再从对应情绪的歌曲库中推荐最适合的歌曲，并由 AI 生成专属签文解读。',
  },
  {
    q: '不填出生年份可以用吗？',
    a: '可以。不填写时，系统仅使用当日天干五行和问题关键词进行推荐，结果仍有参考意义，只是个性化程度略低。',
  },
  {
    q: '歌词是真实的歌词吗？',
    a: '展示的一句歌词摘录来自真实歌曲，但更多的"签文解读"是 AI 根据命理逻辑原创的叙述性文字，并非大段引用歌词。',
  },
  {
    q: '一天可以求签几次？',
    a: '免费用户每天可求签 1 次，VIP 用户不限次数。每次问题不同，推荐的歌曲和签文也会不同。',
  },
  {
    q: '这个功能准确吗？',
    a: '音乐运势签是娱乐性的命理参考工具，不具备预测功能。我们希望它能给你一个新的视角，引发你对当下处境的思考，而非提供确定性答案。',
  },
];

/* ─── 特性卡 ─── */
const FEATURES = [
  { icon: '⭐', title: '命理驱动', desc: '基于八字日主五行、当日天干、你的问题三重匹配，有理可说' },
  { icon: '🤖', title: 'AI 签文', desc: 'AI 为你讲述这首歌与你当下命理的连接，200字内精准解读' },
  { icon: '✍️', title: '版权安全', desc: '只展示歌名+一句歌词摘录，其余均为 AI 原创签文' },
];

/* ─── 类型 ─── */
interface OracleResult {
  songName: string;
  artist: string;
  lyricsQuote: string;
  oracleText: string;
  musicTags: string[];
  wuxingNote: string;
  todayGanzhi: string;
  wuxing: string;
  recordId?: string;
}

export default function MusicOraclePageClient() {
  const { status } = useSession();
  const gate = useAiGate(status === 'authenticated');
  const [question, setQuestion] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [birthYear, setBirthYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [result, setResult] = useState<OracleResult | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  // 默认全部展开，可单独折叠
  const [openFaqs, setOpenFaqs] = useState<number[]>(() => FAQ_LIST.map((_, i) => i));
  const toggleFaq = (i: number) =>
    setOpenFaqs((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  const [showExample, setShowExample] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const MAX_CHARS = 50;

  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
    setQuestion(tag === '感情' ? '我的感情运势如何？'
      : tag === '事业' ? '最近事业上要注意什么？'
      : tag === '财运' ? '最近财运怎么样？'
      : tag === '人际' ? '人际关系方面有什么建议？'
      : '健康方面需要注意什么？');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSubmit = async () => {
    if (!question.trim() || loading || streaming) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setStreamingText('');

    try {
      const body: Record<string, any> = { question: question.trim() };
      if (birthYear) body.birthYear = parseInt(birthYear, 10);

      const res = await fetch('/api/music-oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({})) as { message?: string; error?: string; code?: string };
        const gateCode =
          res.status === 429 && d?.code === 'RATE_LIMIT'
            ? 'QUOTA_EXCEEDED'
            : (d?.code || d?.error);
        if (gate.handle(res.status, gateCode)) {
          setLoading(false);
          return;
        }
        setError(d?.message || d?.error || '求签失败，请稍后重试');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let metaData: OracleResult | null = null;
      let acc = '';

      setLoading(false);
      setStreaming(true);

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
            if (json.meta) {
              // 收到元数据，先显示歌曲信息（oracleText 留空，等 stream 填充）
              metaData = { ...json.meta.data, oracleText: '' };
              setResult(metaData);
              setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            } else if (json.content) {
              acc += json.content;
              setStreamingText(acc);
              if (metaData) {
                setResult({ ...metaData, oracleText: acc });
              }
            }
          } catch {}
        }
      }
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleShare = async () => {
    if (!resultRef.current || sharing) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(resultRef.current, {
        quality: 0.95,
        backgroundColor: '#FFFFFF',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `命运之歌-${result?.songName || '分享'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('分享截图失败:', err);
    } finally {
      setSharing(false);
    }
  };

  const cover = wuxingCover(result?.wuxing || '木');

  return (
    <div className="min-h-dvh bg-[#FAF9F6]">
      <Container className="pt-10 pb-6 md:pt-16 md:pb-10">
        {/* ① 标题区 */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-[26px] md:text-[32px] font-serif font-semibold text-[#1C1A16]">
            音乐运势签
          </h1>
          <p className="text-[13px] font-mono text-[#9CA3AF] tracking-widest mt-1">
            Music Oracle · 命运之音
          </p>
          <p className="text-base text-[#6B7280] mt-4 max-w-md mx-auto">
            带着你的问题，让命理为你指引今天的歌
          </p>
        </div>

        {/* ② 问题输入区 */}
        <div className="max-w-page mx-auto">
          <label className="block text-sm font-medium text-[#1C1A16] mb-2">
            你想问命运什么？
          </label>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setQuestion(e.target.value);
                  setActiveTag(null);
                }
              }}
              disabled={loading}
              placeholder='比如"要不要换工作？"、"他是真心的吗？"'
              className="w-full bg-white border border-[#E5E0D8] rounded-xl px-4 py-3 text-[15px] text-[#1C1A16] placeholder-[#B5B0A8] resize-none max-h-[120px] focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/25 outline-none transition-all disabled:opacity-50"
              rows={2}
            />
            <span className="absolute bottom-2 right-3 text-xs text-[#9CA3AF]">
              ({question.length}/{MAX_CHARS})
            </span>
          </div>

          {/* 快捷话题标签 */}
          <div className="flex flex-nowrap gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                disabled={loading}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-all disabled:opacity-50 ${
                  activeTag === tag
                    ? 'border-brand-accent bg-brand-accent text-white'
                    : 'border-[#E5E0D8] bg-white text-[#6B7280] hover:border-[#1C1A16] hover:text-[#1C1A16]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* 示例结果折叠区 */}
          <button
            type="button"
            onClick={() => setShowExample((v) => !v)}
            className="text-sm text-[#9CA3AF] underline cursor-pointer mt-3 inline-block bg-transparent border-0 p-0"
          >
            {showExample ? '收起示例 ↑' : '查看示例结果 ↓'}
          </button>
          {showExample && (
            <div className="mt-3 bg-white border border-[#F0EDE8] rounded-2xl p-6 shadow-md">
              <p className="text-xs text-[#9CA3AF] mb-3 text-center">
                ✨ 示例效果，非真实推算
              </p>
              <p className="text-[13px] font-medium text-[#9CA3AF] mb-5 text-center">
                ✨ 命运为你选择了这首歌
              </p>

              {/* 歌曲信息 */}
              <div className="flex gap-4">
                <div
                  className="w-[120px] h-[120px] rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm"
                  style={{
                    background: wuxingColor('水').bg,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  }}
                >
                  <span className="text-5xl">{WUXING_ICONS['水']}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[22px] font-serif font-semibold text-[#1C1A16]">
                    《后来》
                  </h2>
                  <p className="text-sm text-[#6B7280] mt-0.5">
                    刘若英
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {['怀念', '放下', '温柔'].map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full bg-[#F5F2ED] text-[#6B7280]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-base italic font-serif text-[#1C1A16] leading-relaxed mt-3">
                    ❝ 后来，我总算学会了如何去爱 ❞
                  </p>
                </div>
              </div>

              {/* 分割线 + 命运签文 */}
              <div className="relative my-5">
                <div className="border-t border-[#F0EDE8]" />
                <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs font-medium text-[#9CA3AF] tracking-[0.2em]">
                  命运签文
                </span>
              </div>

              {/* 签文正文 */}
              <div className="text-[15px] text-[#1C1A16] leading-[1.9] whitespace-pre-line min-h-[2rem]">
                今日壬水当令，适合回望与整理。命运为你选了这首歌，不是要你沉溺，而是提醒你：曾经的重量，已经成了你的底色。
              </div>

              {/* 五行分析 */}
              <div className="bg-[#FAF9F6] rounded-xl p-4 mt-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-xs text-[#9CA3AF]">你的问题</span>
                    <p className="text-[13px] text-[#4B5563] font-medium mt-0.5">
                      感情 · 示例问题
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[#9CA3AF]">今日天干</span>
                    <p className="text-[13px] text-[#4B5563] font-medium mt-0.5">
                      壬水（壬水）
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[#9CA3AF]">情绪色彩</span>
                    <p className="text-[13px] text-[#4B5563] font-medium mt-0.5">
                      怀念 · 放下 · 温柔
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 出生年份 */}
          <div className="mt-5">
            <label className="block text-[13px] text-[#6B7280] mb-1.5">
              出生年份（可选，提升准确度）
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={birthYear}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setBirthYear(val);
              }}
              disabled={loading}
              placeholder="例如 1990"
              maxLength={4}
              className="w-36 h-11 bg-white border border-[#E5E0D8] rounded-xl px-4 text-[15px] text-[#1C1A16] placeholder-[#B5B0A8] focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/25 outline-none transition-all disabled:opacity-50"
            />
            <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1">
              🔒 用于计算你的日主五行，不填仅用当日天干推算
            </p>
          </div>

          {/* 求签按钮 */}
          <div className="text-center mt-6">
            <button
              onClick={handleSubmit}
              disabled={!question.trim() || loading}
              className={`min-h-[44px] px-10 py-3.5 rounded-xl text-base font-medium transition-all ${
                !question.trim() || loading
                  ? 'bg-[#E5E0D8] text-[#B5B0A8] cursor-not-allowed'
                  : 'bg-brand-accent text-white hover:bg-brand-accent-hover'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  命运正在思考...
                </span>
              ) : (
                <span>{!question.trim() ? '↑ 先告诉命运你的问题' : '🎲 开始求签'}</span>
              )}
            </button>
            <p className="text-xs text-[#9CA3AF] mt-2 text-center">
              免费用户每天 1 次
              {status !== 'authenticated' && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => gate.openAuth()}
                    className="underline cursor-pointer bg-transparent border-0 p-0 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                  >
                    登录后使用
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="max-w-page mx-auto mt-6 text-center">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <button
              onClick={handleSubmit}
              className="text-sm font-medium text-[#1C1A16] hover:underline"
            >
              重试
            </button>
          </div>
        )}

        {/* ③ 求签结果区 */}
        {result && (
          <div
            ref={resultRef}
            className="max-w-page mx-auto mt-8 bg-white border border-[#F0EDE8] rounded-2xl p-6 shadow-md animate-slide-up"
          >
            {/* 标题 */}
            <p className="text-[13px] font-medium text-[#9CA3AF] mb-5 text-center">
              ✨ 命运为你选择了这首歌
            </p>

            {/* 歌曲信息 */}
            <div className="flex gap-4">
              <div
                className="w-[120px] h-[120px] rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm"
                style={{
                  background: cover.bg,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                }}
              >
                <span className="text-5xl">{cover.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[22px] font-serif font-semibold text-[#1C1A16]">
                  《{result.songName}》
                </h2>
                <p className="text-sm text-[#6B7280] mt-0.5">
                  {result.artist}
                </p>
                {result.musicTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {result.musicTags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full bg-[#F5F2ED] text-[#6B7280]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-base italic font-serif text-[#1C1A16] leading-relaxed mt-3">
                  ❝ {result.lyricsQuote} ❞
                </p>
              </div>
            </div>

            {/* 分割线 + 命运签文 */}
            <div className="relative my-5">
              <div className="border-t border-[#F0EDE8]" />
              <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs font-medium text-[#9CA3AF] tracking-[0.2em]">
                命运签文
              </span>
            </div>

            {/* 签文正文 */}
            <div className="text-[15px] text-[#1C1A16] leading-[1.9] whitespace-pre-line min-h-[2rem]">
              {!result.oracleText && streaming ? (
                <OracleLoading />
              ) : (
                <>
                  {result.oracleText}
                  {streaming && result.oracleText && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#1C1A16]/40 align-middle animate-pulse" />
                  )}
                </>
              )}
            </div>

            {/* 五行分析 */}
            <div className="bg-[#FAF9F6] rounded-xl p-4 mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-xs text-[#9CA3AF]">你的问题</span>
                  <p className="text-[13px] text-[#4B5563] font-medium mt-0.5">
                    {activeTag || '自由提问'} · {question.length > 15 ? question.slice(0, 15) + '...' : question}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#9CA3AF]">今日天干</span>
                  <p className="text-[13px] text-[#4B5563] font-medium mt-0.5">
                    {result.todayGanzhi}（{result.wuxingNote}）
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#9CA3AF]">情绪色彩</span>
                  <p className="text-[13px] text-[#4B5563] font-medium mt-0.5">
                    {result.musicTags.join(' · ')}
                  </p>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
              <button
                onClick={handleShare}
                disabled={sharing}
                className="w-full sm:w-auto min-h-[44px] bg-brand-accent text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-brand-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                {sharing ? '生成中...' : '下载分享图'}
              </button>
              <a
                href={`https://music.163.com/#/search/m/?s=${encodeURIComponent(result.songName + ' ' + result.artist)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-[44px] border border-[#E5E0D8] text-[#6B7280] rounded-xl px-6 py-2.5 text-sm font-medium hover:border-[#1C1A16] hover:text-[#1C1A16] transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                去听这首歌
              </a>
              {result.recordId && (
                <button
                  onClick={async () => {
                    const url = `${window.location.origin}/api/og/music-oracle/${result.recordId}`;
                    try {
                      await navigator.clipboard.writeText(url);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    } catch {}
                  }}
                  className="w-full sm:w-auto min-h-[44px] border border-[#E5E0D8] text-[#6B7280] rounded-xl px-6 py-2.5 text-sm font-medium hover:border-[#1C1A16] hover:text-[#1C1A16] transition-colors flex items-center justify-center gap-2"
                >
                  {linkCopied ? '✅ 已复制' : '🔗 复制分享链接'}
                </button>
              )}
              <button
                onClick={handleReset}
                className="w-full sm:w-auto min-h-[44px] border border-[#E5E0D8] text-[#6B7280] rounded-xl px-6 py-2.5 text-sm font-medium hover:border-[#1C1A16] hover:text-[#1C1A16] transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重新求签
              </button>
            </div>

            {/* 历史记录入口 */}
            <div className="text-center mt-4">
              <a href="/history" className="text-xs text-[#9CA3AF] hover:text-[#6B7280] underline transition-colors">
                查看我的命理历史记录 →
              </a>
            </div>
          </div>
        )}

        {/* ④ 功能介绍区 */}
        <div className="max-w-page mx-auto mt-16 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 text-center shadow-sm border border-[#F0EDE8]"
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="text-sm font-semibold text-[#1C1A16] mt-3">{f.title}</h3>
                <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ⑤ FAQ */}
        <div className="max-w-page mx-auto mb-12">
          <h2 className="text-lg font-serif font-semibold text-[#1C1A16] text-center mb-6">
            常见问题
          </h2>
          <div className="space-y-2">
            {FAQ_LIST.map((item, i) => (
              <div key={i} className="border border-[#F0EDE8] rounded-xl bg-white overflow-hidden">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-[#1C1A16] pr-4">{item.q}</span>
                  {openFaqs.includes(i) ? (
                    <ChevronUp className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                  )}
                </button>
                {openFaqs.includes(i) && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-[#6B7280] leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 免责声明 */}
        <div className="text-center text-xs text-[#9CA3AF] py-3 bg-white/50 rounded-lg max-w-page mx-auto mb-8">
          ⚠️ 音乐运势签为娱乐性命理参考工具，不具备预测功能，请理性对待。
        </div>
      </Container>

      <Footer />

      <AiGateModals gate={gate} callbackUrl="/music-oracle" />
    </div>
  );
}
