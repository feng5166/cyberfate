'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sparkles } from 'lucide-react';

const methods = [
  { id: 'time', name: '时间起卦', desc: '根据当前时间自动起卦' },
  { id: 'number', name: '数字起卦', desc: '输入两个数字起卦' },
];

export default function MeihuaPage() {
  const [method, setMethod] = useState('');
  const [numbers, setNumbers] = useState({ num1: '', num2: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDraw = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/meihua/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, numbers })
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-8 h-8" />
            <h1 className="font-heading text-3xl font-bold text-primary">梅花易数</h1>
          </div>
          <p className="text-secondary">快速起卦，洞察吉凶</p>
        </div>

        {!method && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {methods.map((m) => (
              <Card 
                key={m.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setMethod(m.id)}
              >
                <div className="text-center p-6">
                  <h3 className="text-lg font-semibold text-primary mb-2">{m.name}</h3>
                  <p className="text-sm text-secondary">{m.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {method && !result && (
          <Card>
            <div className="space-y-6">
              {method === 'number' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">第一个数字</label>
                    <input
                      type="number"
                      value={numbers.num1}
                      onChange={(e) => setNumbers({ ...numbers, num1: e.target.value })}
                      className="w-full px-4 py-3 rounded bg-white border border-border text-primary focus:outline-none focus:border-primary"
                      placeholder="1-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">第二个数字</label>
                    <input
                      type="number"
                      value={numbers.num2}
                      onChange={(e) => setNumbers({ ...numbers, num2: e.target.value })}
                      className="w-full px-4 py-3 rounded bg-white border border-border text-primary focus:outline-none focus:border-primary"
                      placeholder="1-100"
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setMethod('')} className="flex-1">
                  返回
                </Button>
                <Button onClick={handleDraw} loading={loading} className="flex-1">
                  {loading ? '起卦中...' : '开始起卦'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {result && (
          <div className="space-y-6">
            <Card>
              <h3 className="font-semibold text-primary mb-4">卦象</h3>
              <div className="text-center space-y-2">
                <div className="text-2xl font-mono">{result.gua}</div>
                <div className="text-lg text-primary">{result.guaName}</div>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-primary mb-3">🔮 卦象解读</h3>
              <p className="text-secondary leading-relaxed whitespace-pre-wrap">{result.analysis}</p>
            </Card>

            <Button onClick={() => { setResult(null); setMethod(''); }} variant="secondary" className="w-full">
              重新起卦
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
