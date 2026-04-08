'use client';

import { Footer } from '@/components/layout/Footer';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar } from 'lucide-react';

export default function HuangliPage() {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    loadDate(today);
  }, []);

  const loadDate = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/huangli?date=${date}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    loadDate(date);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-16">
        {/* 标题区 */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Calendar className="w-8 h-8 text-[#1C1A16]" />
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1C1A16]">
              AI 黄历
            </h1>
          </div>
          <p className="text-[#1C1A16]/55 text-base">
            查看每日宜忌，把握吉时
          </p>
        </div>

        {/* 日期选择卡片 */}
        <div className="bg-white rounded-2xl border border-[#1C1A16]/10 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-[#1C1A16]/55">
              选择日期
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="h-12 px-4 rounded-xl border border-[#1C1A16]/15 bg-white text-[#1C1A16] text-sm focus:outline-none focus:ring-2 focus:ring-[#1C1A16]/10 transition-shadow"
            />
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="bg-white rounded-2xl border border-[#1C1A16]/10 shadow-sm p-6">
            <div className="text-center py-10">
              <div className="inline-block animate-spin text-4xl mb-4">📅</div>
              <p className="text-[#1C1A16]/55">加载中...</p>
            </div>
          </div>
        )}

        {/* 结果区域 */}
        {data && !loading && (
          <div className="space-y-6">
            {/* 日期信息卡 */}
            <div className="bg-white rounded-2xl border border-[#1C1A16]/10 shadow-sm p-6">
              <h3 className="font-display text-lg font-semibold text-[#1C1A16] mb-4">
                日期信息
              </h3>
              <div className="space-y-3 text-sm">
                <p className="text-[#1C1A16]">
                  <span className="text-[#1C1A16]/25 mr-2">公历</span>
                  {data.solar}
                </p>
                <p className="text-[#1C1A16]">
                  <span className="text-[#1C1A16]/25 mr-2">农历</span>
                  {data.lunar}
                </p>
                <p className="text-[#1C1A16]">
                  <span className="text-[#1C1A16]/25 mr-2">干支</span>
                  {data.ganzhi}
                </p>
              </div>
            </div>

            {/* 宜忌卡片 */}
            <div className="bg-white rounded-2xl border border-[#1C1A16]/10 shadow-sm p-6">
              <h3 className="font-display text-lg font-semibold text-[#1C1A16] mb-5">
                宜忌事项
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-emerald-700 mb-3">宜</p>
                  <div className="flex flex-wrap gap-2">
                    {data.yi.map((item: string, i: number) => (
                      <span
                        key={i}
                        className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-700 mb-3">忌</p>
                  <div className="flex flex-wrap gap-2">
                    {data.ji.map((item: string, i: number) => (
                      <span
                        key={i}
                        className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 个性化建议卡 */}
            {session && data.personalAdvice && (
              <div className="bg-white rounded-2xl border border-[#1C1A16]/10 shadow-sm p-6">
                <h3 className="font-display text-lg font-semibold text-[#1C1A16] mb-3">
                  🔮 个性化建议
                </h3>
                <p className="text-[#1C1A16]/55 leading-relaxed text-sm">
                  {data.personalAdvice}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
