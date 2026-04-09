'use client';

import type { HuangliData } from '@/lib/huangli/calculator';
import { WUXING_COLORS, getZhiXingColor } from '@/lib/huangli/calculator';

interface DayDetailCardProps {
  data: HuangliData;
}

function Tag({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function DayDetailCard({ data }: DayDetailCardProps) {
  const zhiXingColor = getZhiXingColor(data.zhiXing);
  const dayWuxingColor = WUXING_COLORS[data.dayWuxing];
  const yearWuxingColor = WUXING_COLORS[data.yearWuxing];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-5 md:p-7">
      {/* 区块A: 基础信息 */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-lg font-semibold text-[#1C1A16]">{data.solar}</span>
        <Tag className="bg-[#F0EDE8]/60 text-[#1C1A16]/70">{data.weekday}</Tag>
        <Tag className="bg-[#F0EDE8]/60 text-[#1C1A16]/70">
          {data.lunarMonthName}月{data.lunarDayName}
        </Tag>
        <div className="flex items-center gap-1">
          <Tag className="bg-[#F0EDE8]/60 text-[#1C1A16]/70">{data.yearGanzhi}年</Tag>
          <Tag className="bg-[#F0EDE8]/60 text-[#1C1A16]/70">{data.monthGanzhi}月</Tag>
          <Tag className="bg-amber-100 text-[#1C1A16] border border-amber-300 font-semibold">{data.dayGanzhi}日</Tag>
        </div>
        <Tag className={`${zhiXingColor.bg} ${zhiXingColor.text}`}>
          {data.zhiXing}日
        </Tag>
      </div>

      {/* 纳音 */}
      <p className="text-xs text-[#1C1A16]/40 mb-5">
        纳音：[年]{data.yearNayin} / [月]{data.monthNayin} / [日]{data.dayNayin}
      </p>

      {/* 区块B: 五行与冲煞 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className={`rounded-xl p-3 text-center ${dayWuxingColor.bg}`}>
          <span className={`text-2xl font-bold block ${dayWuxingColor.text}`}>
            {data.dayWuxing}
          </span>
          <span className="text-xs text-[#1C1A16]/50 mt-1 block">日主五行</span>
        </div>
        <div className={`rounded-xl p-3 text-center ${yearWuxingColor.bg}`}>
          <span className={`text-2xl font-bold block ${yearWuxingColor.text}`}>
            {data.yearWuxing}
          </span>
          <span className="text-xs text-[#1C1A16]/50 mt-1 block">年五行</span>
        </div>
        <div className="rounded-xl p-3 text-center bg-orange-50">
          <span className="text-lg font-bold block text-orange-700">
            冲{data.chongShengxiao}
          </span>
          <span className="text-xs text-orange-600/70 mt-1 block">
            煞{data.sha}
          </span>
        </div>
      </div>

      {/* 区块C: 宜忌 Tag 云 */}
      <div className="space-y-4">
        <div>
          <h4 className="text-base font-medium text-[#1C1A16] mb-2">宜</h4>
          <div className="flex flex-wrap gap-2">
            {data.yi.map((item, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-sm bg-green-50 text-green-700 border border-green-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-base font-medium text-[#1C1A16] mb-2">忌</h4>
          <div className="flex flex-wrap gap-2">
            {data.ji.map((item, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-sm bg-red-50 text-red-700 border border-red-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
