'use client';

import { useState, useRef } from 'react';
import { Container } from '@/components/ui/Container';
import { Footer } from '@/components/layout/Footer';
import { Share2, RefreshCw, ChevronDown, ChevronUp, Music, Loader2, Sparkles } from 'lucide-react';
import { toPng } from 'html-to-image';

/* ─── 五行渐变色 ─── */
const WUXING_GRADIENTS: Record<string, { from: string; to: string; icon: string }> = {
  木: { from: '#ecfdf5', to: '#dcfce7', icon: '🌿' },
  火: { from: '#fff7ed', to: '#fee2e2', icon: '🔥' },
  土: { from: '#fefce8', to: '#fef3c7', icon: '🏔' },
  金: { from: '#f9fafb', to: '#f1f5f9', icon: '✨' },
  水: { from: '#eff6ff', to: '#e0e7ff', icon: '💧' },
};

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
    a: '免费用户每天可求签 3 次，VIP 用户不限次数。每次问题不同，推荐的歌曲和签文也会不同。',
  },
  {
    q: '这个功能准确吗？',
    a: '音乐运势签是娱乐性的命理参考工具，不具备预测功能。我们希望它能给你一个新的视角，引发你对当下处境的思考，而非提供确定性答案。',
  },
];

/* ─── 特性卡 ─── */
const FEATURES = [
  { icon: '🔮', title: '命理驱动', desc: '基于八字日主五行、当日天干、你的问题三重匹配，有理可说' },
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
  const [question, setQuestion] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [birthYear, setBirthYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OracleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
  };

  const handleSubmit = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: Record<string, any> = { question: question.trim() };
      if (birthYear) body.birthYear = parseInt(birthYear, 10);

      const res = await fetch('/api/music-oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (json.success) {
        setResult(json.data);
        // 滚到结果区
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        setError(json.error || '求签失败，请稍后重试');
      }
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
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

  const gradient = result ? (WUXING_GRADIENTS[result.wuxing] || WUXING_GRADIENTS['木']) : WUXING_GRADIENTS['木'];

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Container className="pt-10 pb-6 md:pt-16 md:pb-10">
        {/* ① 标题区 */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center mb-3">
            <Music className="w-10 h-10 md:w-12 md:h-12 text-[#1C1A16]" />
          </div>
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
        <div className="max-w-2xl mx-auto">
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
              className="w-full bg-white border border-[#E5E0D8] rounded-xl px-4 py-3 text-[15px] text-[#1C1A16] placeholder-[#B5B0A8] resize-none max-h-[120px] focus:border-[#1C1A16] focus:ring-2 focus:ring-[#1C1A16]/10 outline-none transition-all disabled:opacity-50"
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
                    ? 'border-[#1C1A16] bg-[#1C1A16] text-white'
                    : 'border-[#E5E0D8] bg-white text-[#6B7280] hover:border-[#1C1A16] hover:text-[#1C1A16]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

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
              className="w-36 h-10 bg-white border border-[#E5E0D8] rounded-xl px-4 text-[15px] text-[#1C1A16] placeholder-[#B5B0A8] focus:border-[#1C1A16] focus:ring-2 focus:ring-[#1C1A16]/10 outline-none transition-all disabled:opacity-50"
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
              className={`px-10 py-3.5 rounded-xl text-base font-medium transition-all ${
                !question.trim() || loading
                  ? 'bg-[#E5E0D8] text-[#B5B0A8] cursor-not-allowed'
                  : 'bg-[#1C1A16] text-white hover:bg-[#2D2B26]'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  命运正在思考...
                </span>
              ) : (
                <span>🎲 开始求签</span>
              )}
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="max-w-2xl mx-auto mt-6 text-center">
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
            className="max-w-2xl mx-auto mt-8 bg-white border border-[#F0EDE8] rounded-2xl p-6 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-400"
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
                  background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                }}
              >
                <span className="text-5xl">{gradient.icon}</span>
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
            <div className="text-[15px] text-[#1C1A16] leading-[1.9] whitespace-pre-line">
              {result.oracleText}
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
                className="w-full sm:w-auto bg-[#1C1A16] text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-[#2D2B26] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                {sharing ? '生成中...' : '下载分享图'}
              </button>
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
                  className="w-full sm:w-auto border border-[#E5E0D8] text-[#6B7280] rounded-xl px-6 py-2.5 text-sm font-medium hover:border-[#1C1A16] hover:text-[#1C1A16] transition-colors flex items-center justify-center gap-2"
                >
                  {linkCopied ? '✅ 已复制' : '🔗 复制分享链接'}
                </button>
              )}
              <button
                onClick={handleReset}
                className="w-full sm:w-auto border border-[#E5E0D8] text-[#6B7280] rounded-xl px-6 py-2.5 text-sm font-medium hover:border-[#1C1A16] hover:text-[#1C1A16] transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重新求签
              </button>
            </div>
          </div>
        )}

        {/* ④ 功能介绍区 */}
        <div className="max-w-4xl mx-auto mt-16 mb-12">
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
        <div className="max-w-2xl mx-auto mb-12">
          <h2 className="text-lg font-serif font-semibold text-[#1C1A16] text-center mb-6">
            常见问题
          </h2>
          <div className="space-y-2">
            {FAQ_LIST.map((item, i) => (
              <div key={i} className="border border-[#F0EDE8] rounded-xl bg-white overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-[#1C1A16] pr-4">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-[#6B7280] leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 免责声明 */}
        <div className="text-center text-xs text-[#9CA3AF] py-3 bg-white/50 rounded-lg max-w-2xl mx-auto mb-8">
          ⚠️ 音乐运势签为娱乐性命理参考工具，不具备预测功能，请理性对待。
        </div>
      </Container>

      <Footer />
    </div>
  );
}
