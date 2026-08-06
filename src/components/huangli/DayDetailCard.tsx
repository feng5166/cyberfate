'use client';

import type { HuangliData } from '@/lib/huangli/calculator';
import { wuxingColor } from '@/data/wuxing';

interface DayDetailCardProps {
  data: HuangliData;
}

// 建除十二神配色。从 lib/huangli/calculator 内联至此：那边顶层 require('lunar-javascript')，
// 客户端 value-import 会拖整库进首屏；类名保持字面量供 Tailwind 静态扫描。
function getZhiXingColor(zhiXing: string): { bg: string; text: string } {
  const good = ['建', '除', '满', '成', '开'];
  const bad = ['破', '危', '收', '闭'];
  if (good.includes(zhiXing)) return { bg: 'bg-green-50', text: 'text-green-700' };
  if (bad.includes(zhiXing)) return { bg: 'bg-red-50', text: 'text-red-700' };
  return { bg: 'bg-gray-50', text: 'text-gray-700' };
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
  // 五行配色改从全站唯一真源 src/data/wuxing.ts 取 hex（与原 calculator 内 class 同值），
  // 内联 style 替代任意值 class，效果一致且不再依赖 calculator 的 value-export
  const dayWuxingColor = wuxingColor(data.dayWuxing);
  const yearWuxingColor = wuxingColor(data.yearWuxing);

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-[#1C1A16]/8 p-5 md:p-7">
      {/* 干支水印装饰 */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-1 -bottom-5 font-display text-[64px] leading-none text-[#1C1A16]/[0.05] select-none tracking-[0.12em]"
      >
        {data.dayGanzhi}
      </span>
      {/* 区块A: 基础信息 */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-lg font-semibold text-[#1C1A16]">{data.solar}</span>
        <Tag className="bg-[#F6F4F1] text-[#1C1A16]/70">{data.weekday}</Tag>
        <Tag className="bg-[#F6F4F1] text-[#1C1A16]/70">
          {data.lunarMonthName}月{data.lunarDayName}
        </Tag>
        <div className="flex items-center gap-1">
          <Tag className="bg-[#F6F4F1] text-[#1C1A16]/70">{data.yearGanzhi}年</Tag>
          <Tag className="bg-[#F6F4F1] text-[#1C1A16]/70">{data.monthGanzhi}月</Tag>
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
            style={{ background: '#FEE2E2', color: '#DC2626' }}
          >
            {data.dayGanzhi}日
          </span>
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
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="rounded-xl p-3 md:p-4 text-center" style={{ background: dayWuxingColor.bg }}>
          <span className="text-2xl md:text-3xl font-bold block" style={{ color: dayWuxingColor.text }}>
            {data.dayWuxing}
          </span>
          <span className="text-xs md:text-sm text-[#1C1A16]/50 mt-1 block">日主五行</span>
        </div>
        <div className="rounded-xl p-3 md:p-4 text-center" style={{ background: yearWuxingColor.bg }}>
          <span className="text-2xl md:text-3xl font-bold block" style={{ color: yearWuxingColor.text }}>
            {data.yearWuxing}
          </span>
          <span className="text-xs md:text-sm text-[#1C1A16]/50 mt-1 block">年五行</span>
        </div>
        <div className="rounded-xl p-3 md:p-4 text-center bg-[#FAF9F6] border border-[#1C1A16]/6">
          <span className="text-lg md:text-xl font-bold block text-[#1C1A16]">
            冲{data.chongShengxiao}
          </span>
          <span className="text-xs md:text-sm text-[#1C1A16]/70 mt-1 block">
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
                className="px-3 py-1 rounded-full text-sm bg-emerald-50 text-emerald-700 border border-emerald-200"
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
