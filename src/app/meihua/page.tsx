'use client';

import { Footer } from '@/components/layout/Footer';
import { Clock3, Hash } from 'lucide-react';
import { useState } from 'react';

const methods = [
  { id: 'time', name: '时间起卦', desc: '根据当前时间自动起卦', icon: Clock3 },
  { id: 'number', name: '数字起卦', desc: '输入两个数字起卦', icon: Hash },
] as const;

type MeihuaResult = {
  gua: string;
  guaName: string;
  analysis: string;
  _source?: string;
};

export default function MeihuaPage() {
  const [method, setMethod] = useState('');
  const [numbers, setNumbers] = useState({ num1: '', num2: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MeihuaResult | null>(null);

  const handleDraw = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/meihua/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, numbers }),
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
    <div className="relative min-h-screen bg-[#FAF9F6] text-[#1C1A16]">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='none' stroke='%231C1A16' stroke-width='1'/%3E%3Cpath d='M50 5 A45 45 0 0 1 50 95 A22.5 22.5 0 0 0 50 50 A22.5 22.5 0 0 1 50 5' fill='%231C1A16'/%3E%3Cpath d='M50 95 A45 45 0 0 1 50 5 A22.5 22.5 0 0 0 50 50 A22.5 22.5 0 0 1 50 95' fill='%23FFFFFF'/%3E%3Ccircle cx='50' cy='27' r='5' fill='%23FFFFFF' stroke='%231C1A16' stroke-width='1'/%3E%3Ccircle cx='50' cy='73' r='5' fill='%231C1A16'/%3E%3C/svg%3E\")",
          backgroundSize: '140px 140px',
          backgroundRepeat: 'repeat',
        }}
      />

      <main className="px-4 pb-20 md:pb-24">
        <section className="mx-auto max-w-4xl pt-30 pb-20 text-center animate-fadeIn">
          <div className="mx-auto mb-6 h-px w-9 bg-gradient-to-r from-transparent via-[#1C1A16] to-transparent opacity-15" />
          <h1 className="font-display text-[clamp(44px,6vw,60px)] leading-none tracking-[0.625rem] text-[#1C1A16]">
            梅花易数
          </h1>
          <p className="mt-6 text-[17px] tracking-[0.3125rem] text-[rgba(28,26,22,0.42)]">
            以象观变 见微知著
          </p>
          <blockquote className="mx-auto mt-8 max-w-[560px] text-[13px] leading-relaxed text-[rgba(28,26,22,0.42)]">
            <p className="font-['Noto_Serif_SC',serif]">
              「寂然不动，感而遂通天下之故。」
            </p>
          </blockquote>
        </section>

        {!method && (
          <section className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2 animate-fadeIn">
            {methods.map((m, index) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className="group rounded-2xl border border-[#1C1A16]/8 bg-white p-8 text-left shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <Icon className="h-8 w-8 text-[#1C1A16]/75" strokeWidth={1.6} />
                  <h3 className="mt-5 text-[17px] font-semibold text-[#1C1A16]">{m.name}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[rgba(28,26,22,0.42)]">{m.desc}</p>
                </button>
              );
            })}
          </section>
        )}

        {method && !result && (
          <section className="mx-auto max-w-3xl animate-fadeIn">
            <div className="rounded-2xl border border-[#1C1A16]/8 bg-white p-8 md:p-10">
              {method === 'number' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1C1A16]/70">第一个数字</label>
                    <input
                      type="number"
                      value={numbers.num1}
                      onChange={(e) => setNumbers({ ...numbers, num1: e.target.value })}
                      className="h-12 w-full rounded-lg border border-[#1C1A16]/15 bg-white px-4 text-sm text-[#1C1A16] outline-none transition-all focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10"
                      placeholder="1-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1C1A16]/70">第二个数字</label>
                    <input
                      type="number"
                      value={numbers.num2}
                      onChange={(e) => setNumbers({ ...numbers, num2: e.target.value })}
                      className="h-12 w-full rounded-lg border border-[#1C1A16]/15 bg-white px-4 text-sm text-[#1C1A16] outline-none transition-all focus:border-[#1C1A16]/30 focus:ring-2 focus:ring-[#1C1A16]/10"
                      placeholder="1-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[#1C1A16]/8 bg-[#FAF9F6] px-4 py-3 text-sm text-[rgba(28,26,22,0.42)]">
                  将以当前时间自动起卦。
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setMethod('')}
                  className="inline-flex h-[50px] flex-1 items-center justify-center rounded-lg border border-[#1C1A16]/15 bg-transparent px-[38px] text-[13px] tracking-[0.08em] text-[#1C1A16] transition-all duration-200 hover:border-[#1C1A16]/30 hover:bg-[#FAF9F6]"
                >
                  返回
                </button>
                <button
                  type="button"
                  onClick={handleDraw}
                  disabled={loading}
                  className="inline-flex h-[50px] flex-1 items-center justify-center rounded-lg bg-[#1C1A16] px-[38px] text-[13px] tracking-[0.08em] text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2A2621] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? '起卦中...' : '开始起卦'}
                </button>
              </div>
            </div>
          </section>
        )}

        {result && (
          <section className="mx-auto max-w-3xl space-y-5 animate-fadeIn">
            <div className="rounded-2xl border border-[#1C1A16]/8 bg-white p-8 text-center md:p-10">
              <h3 className="mb-6 text-sm tracking-[0.2em] text-[rgba(28,26,22,0.42)]">卦象</h3>
              <div className="space-y-3">
                <div className="text-3xl font-mono tracking-wide text-[#1C1A16]">{result.gua}</div>
                <div className="text-xl text-[#1C1A16]">{result.guaName}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#1C1A16]/8 bg-white p-8 md:p-10">
              <h3 className="mb-4 font-display text-2xl tracking-[0.08em] text-[#1C1A16]">卦象解读</h3>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[rgba(28,26,22,0.7)]">{result.analysis}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setResult(null);
                setMethod('');
              }}
              className="inline-flex h-[50px] w-full items-center justify-center rounded-lg border border-[#1C1A16]/15 bg-transparent px-[38px] text-[13px] tracking-[0.08em] text-[#1C1A16] transition-all duration-200 hover:border-[#1C1A16]/30 hover:bg-[#FAF9F6]"
            >
              重新起卦
            </button>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
