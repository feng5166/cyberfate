'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sparkles, History, Share2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const spreads = [
  {
    id: 'single',
    name: '单张牌',
    desc: '快速指引',
    detail: '适用于今日运势、快速决策',
    cards: 1,
    free: true,
    freeLimit: '每日 3 次',
  },
  {
    id: 'three',
    name: '三张牌',
    desc: '过去/现在/未来',
    detail: '了解事情发展脉络',
    cards: 3,
    free: true,
    freeLimit: '每日 1 次',
  },
  {
    id: 'celtic',
    name: '凯尔特十字',
    desc: '深度分析',
    detail: '重大决策、深度探索',
    cards: 10,
    free: false,
    freeLimit: 'VIP 专属',
  },
];

interface TarotCard {
  id: string | number;
  name_en: string;
  name_zh: string;
  keywords: string[];
  orientation: 'upright' | 'reversed';
  image_url: string;
}

export default function TarotPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState<'select' | 'question' | 'result'>('select');
  const [selectedSpread, setSelectedSpread] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ cards: TarotCard[]; ai_reading: string } | null>(null);
  const [error, setError] = useState('');

  const handleShare = async () => {
    if (!result) return;
    
    try {
      const res = await fetch('/api/tarot/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cards: result.cards, 
          question, 
          spread: selectedSpread 
        })
      });
      const data = await res.json();
      
      if (navigator.share) {
        await navigator.share({ text: data.shareText });
      } else {
        await navigator.clipboard.writeText(data.shareText);
        alert('分享内容已复制到剪贴板');
      }
    } catch (err) {
      console.error('分享失败:', err);
    }
  };

  const handleSelectSpread = (spreadId: string) => {
    const spread = spreads.find(s => s.id === spreadId);
    if (spread && !spread.free && !session) {
      // VIP 功能需要登录
      window.location.href = '/auth/login?redirect=/tarot';
      return;
    }
    setSelectedSpread(spreadId);
    setStep('question');
  };

  const handleDraw = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tarot/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spread: selectedSpread, question })
      });
      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'VIP_REQUIRED') {
          setError('凯尔特十字牌阵为 VIP 专属功能');
          return;
        }
        throw new Error(data.error || '请求失败');
      }
      const data = await res.json();
      setResult(data);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('select');
    setSelectedSpread('');
    setQuestion('');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-background-alt py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-8 h-8" />
            <h1 className="font-heading text-3xl font-bold text-primary">塔罗占卜</h1>
          </div>
          <p className="text-secondary">静心提问，让塔罗为你指引方向</p>
        </div>

        {/* 步骤 1: 选择牌阵 */}
        {step === 'select' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {spreads.map((spread) => (
              <Card 
                key={spread.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelectSpread(spread.id)}
              >
                <div className="text-center p-4">
                  <div className="text-4xl mb-3">
                    {spread.cards === 1 ? '🃏' : spread.cards === 3 ? '🃏🃏🃏' : '✨'}
                  </div>
                  <h3 className="text-lg font-semibold text-primary mb-1">{spread.name}</h3>
                  <p className="text-sm text-secondary mb-2">{spread.desc}</p>
                  <p className="text-xs text-muted mb-3">{spread.detail}</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs ${
                    spread.free ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {spread.freeLimit}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 步骤 2: 输入问题 */}
        {step === 'question' && (
          <Card>
            <div className="space-y-6">
              <div className="text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
                  {spreads.find(s => s.id === selectedSpread)?.name}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  你想问什么？<span className="text-muted text-xs">（选填）</span>
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="可以是关于感情、事业、学业等任何困扰你的问题"
                  className="w-full px-4 py-3 rounded bg-white border border-border text-primary placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none"
                  rows={4}
                  maxLength={200}
                />
                <div className="text-xs text-muted text-right mt-1">{question.length}/200</div>
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={reset} className="flex-1">
                  返回
                </Button>
                <Button onClick={handleDraw} loading={loading} className="flex-1">
                  {loading ? '抽牌中...' : '开始抽牌'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 步骤 3: 结果展示 */}
        {step === 'result' && result && (
          <div className="space-y-6">
            {/* 牌面展示 */}
            <Card>
              <div className={`grid gap-4 ${
                result.cards.length === 1 ? 'grid-cols-1 justify-items-center' : 
                result.cards.length === 3 ? 'grid-cols-3' : 
                'grid-cols-5'
              }`}>
                {result.cards.map((card, idx) => (
                  <div key={idx} className="text-center">
                    {result.cards.length === 3 && (
                      <div className="text-xs text-muted mb-2">
                        {['过去', '现在', '未来'][idx]}
                      </div>
                    )}
                    <div className="mb-2 flex justify-center">
                      <Image 
                        src={card.image_url} 
                        alt={card.name_zh}
                        width={result.cards.length > 3 ? 80 : 120}
                        height={result.cards.length > 3 ? 140 : 210}
                        className="rounded shadow"
                      />
                    </div>
                    <p className="text-sm font-medium text-primary">{card.name_zh}</p>
                    <p className="text-xs text-muted">
                      {card.orientation === 'upright' ? '正位' : '逆位'}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* AI 解读 */}
            <Card>
              <h3 className="font-semibold text-primary mb-3">🔮 AI 解读</h3>
              <p className="text-secondary leading-relaxed whitespace-pre-wrap">{result.ai_reading}</p>
            </Card>

            {/* 牌意详情 */}
            {result.cards.length === 1 && (
              <Card>
                <h3 className="font-semibold text-primary mb-3">📖 牌意详解</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted mb-1">关键词</p>
                    <div className="flex flex-wrap gap-2">
                      {result.cards[0].keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <Button onClick={handleShare} variant="secondary" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                分享结果
              </Button>
              <Button onClick={reset} variant="secondary" className="flex-1">
                再来一次
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
