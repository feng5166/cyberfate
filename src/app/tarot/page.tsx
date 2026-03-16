'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sparkles } from 'lucide-react';

export default function TarotPage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDraw = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tarot/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spread: 'single', question })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-alt py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-8 h-8" />
            <h1 className="font-heading text-3xl font-bold text-primary">塔罗占卜</h1>
          </div>
          <p className="text-secondary">静心提问，让塔罗为你指引方向</p>
        </div>

        {!result && (
          <Card>
            <div className="space-y-6">
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
              <Button onClick={handleDraw} loading={loading} className="w-full" size="lg">
                {loading ? '抽牌中...' : '开始抽牌'}
              </Button>
            </div>
          </Card>
        )}

        {result && (
          <div className="space-y-6">
            <Card>
              <div className="text-center">
                <div className="text-6xl mb-4">🃏</div>
                <h2 className="text-2xl font-bold text-primary mb-2">{result.cards[0].name_zh}</h2>
                <p className="text-sm text-secondary mb-4">{result.cards[0].name_en}</p>
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                  {result.cards[0].orientation === 'upright' ? '正位' : '逆位'}
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-primary mb-3">🔮 AI 解读</h3>
              <p className="text-secondary leading-relaxed whitespace-pre-wrap">{result.ai_reading}</p>
            </Card>

            <Button onClick={() => setResult(null)} variant="secondary" className="w-full">
              再抽一次
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
