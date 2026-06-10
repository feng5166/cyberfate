import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { FaqJsonLd } from '@/components/seo/FaqJsonLd';
import { calculateHuangli } from '@/lib/huangli/calculator';

export const revalidate = 86400;

function getTodayInShanghai(): { dateStr: string; year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { dateStr, year, month, day };
}

export async function generateMetadata(): Promise<Metadata> {
  const { year, month, day } = getTodayInShanghai();
  const dateStr = `${year}年${month}月${day}日`;
  const data = calculateHuangli(getTodayInShanghai().dateStr);
  const yiPreview = data.yi.slice(0, 4).join('、') || '诸事和顺';
  const jiPreview = data.ji.slice(0, 4).join('、') || '少冲撞';
  return {
    title: `今天适合做什么 | ${dateStr} 黄历宜忌 | CyberFate`,
    description: `${dateStr}老黄历查询，今日宜${yiPreview}，忌${jiPreview}。农历${data.lunarMonthName}月${data.lunarDayName}，${data.weekday}${data.jieqi ? `，${data.jieqi}` : ''}。AI 解读今日宜忌，帮你做出更好的日常决策。`,
    keywords: [
      '今天适合做什么',
      '今日黄历',
      '今天黄历宜忌',
      '今天宜忌',
      '今日宜忌',
      '黄历今天',
      '今天适合',
      '今日运势',
    ],
    alternates: { canonical: 'https://www.cyberfate.me/today' },
    openGraph: {
      title: `今天适合做什么 | ${dateStr} 黄历宜忌`,
      description: `${dateStr} 黄历宜${yiPreview}，忌${jiPreview}。AI 解读今日宜忌。`,
      type: 'website',
      url: 'https://www.cyberfate.me/today',
    },
    twitter: {
      card: 'summary',
      title: `今天适合做什么 | ${dateStr}`,
      description: `${dateStr} 黄历宜${yiPreview}，忌${jiPreview}。`,
    },
  };
}

const FAQ_ITEMS = [
  {
    question: '今天适合结婚吗？',
    answer:
      '是否适合结婚需参考当日黄历宜忌，宜"嫁娶"则吉。同时建议结合双方八字合婚分析、避开冲克新人的日子，才能既合天时又顺人和。CyberFate 的合婚工具可以帮你做更细致的判断。',
  },
  {
    question: '今天适合开业吗？',
    answer:
      '开业宜选"开市"吉日，先看今日黄历宜忌一栏即可得知是否适合。开业是重要节点，除了看通用黄历，还应避开冲煞店主自身的生肖与八字日柱，必要时择吉日动土、上梁、入宅一并考虑。',
  },
  {
    question: '黄历和运势有什么关系？',
    answer:
      '黄历是客观的日期吉凶参考，主要依据干支、建除十二神、神煞分布得出当日通用宜忌。运势则结合个人八字日主与流日五行能量做个性化判断。两者结合使用：先看黄历定大方向，再用运势看个人感受。',
  },
  {
    question: '今天黄历显示忌出行，必须避开吗？',
    answer:
      '黄历宜忌是传统经验的概率性参考，并非绝对禁令。如果你有重要安排难以更改，可以采取"借助吉时、避开冲煞方位"的方式化解。不过对于嫁娶、安葬、动土等重大事项，建议尽量遵循。',
  },
];

export default function TodayPage() {
  const { dateStr, year, month, day } = getTodayInShanghai();
  const data = calculateHuangli(dateStr);
  const weekday = data.weekday;

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `今天适合做什么 - ${year}年${month}月${day}日 黄历宜忌`,
    url: 'https://www.cyberfate.me/today',
    description: `${year}年${month}月${day}日今日黄历宜忌、吉时、冲煞查询。`,
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: 'CyberFate',
      url: 'https://www.cyberfate.me',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <main className="min-h-screen bg-[#FAF9F6] text-[#1C1A16]">
        {/* 标题区 */}
        <section className="px-4 pt-12 md:pt-16 pb-6 max-w-3xl mx-auto text-center">
          <p className="text-sm tracking-widest text-[#1C1A16]/40 uppercase">Today · 黄历宜忌</p>
          <h1 className="font-display text-3xl md:text-5xl font-semibold mt-3 leading-tight">
            今天适合做什么？
          </h1>
          <p className="mt-4 text-base md:text-lg text-[#1C1A16]/60">
            {year} 年 {month} 月 {day} 日 · {weekday}
            {data.jieqi ? ` · ${data.jieqi}` : ''}
          </p>
        </section>

        {/* 核心信息卡片 */}
        <section className="px-4 max-w-3xl mx-auto">
          <div className="rounded-2xl bg-white border border-[#1C1A16]/8 shadow-sm p-6 md:p-8">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 pb-4 border-b border-[#1C1A16]/8">
              <span className="font-display text-4xl md:text-5xl text-[#C75B4B]">
                {month}/{day}
              </span>
              <span className="text-sm text-[#1C1A16]/60">
                农历 {data.lunarMonthName}月{data.lunarDayName}
              </span>
              <span className="text-sm text-[#1C1A16]/60">
                {data.yearGanzhi}年 · {data.dayGanzhi}日
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-[#5B8C5A] mb-3">
                  今日宜
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.yi.length > 0 ? (
                    data.yi.map((item) => (
                      <span
                        key={`yi-${item}`}
                        className="px-3 py-1.5 rounded-full bg-[#5B8C5A]/10 text-[#5B8C5A] text-sm"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#1C1A16]/50">诸事和顺，无特别宜忌</span>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold tracking-wide text-[#C75B4B] mb-3">
                  今日忌
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.ji.length > 0 ? (
                    data.ji.map((item) => (
                      <span
                        key={`ji-${item}`}
                        className="px-3 py-1.5 rounded-full bg-[#C75B4B]/10 text-[#C75B4B] text-sm"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#1C1A16]/50">少冲撞，行止自如</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#1C1A16]/8 text-sm">
              <div>
                <div className="text-[#1C1A16]/50 mb-1">冲煞</div>
                <div className="text-[#1C1A16]/85">
                  冲{data.chongShengxiao}
                  {data.sha ? ` · 煞${data.sha}` : ''}
                </div>
              </div>
              <div>
                <div className="text-[#1C1A16]/50 mb-1">建除</div>
                <div className="text-[#1C1A16]/85">{data.zhiXing}日</div>
              </div>
              <div>
                <div className="text-[#1C1A16]/50 mb-1">值神</div>
                <div className="text-[#1C1A16]/85">
                  {data.jiShen[0] || '—'}
                </div>
              </div>
              <div>
                <div className="text-[#1C1A16]/50 mb-1">星宿</div>
                <div className="text-[#1C1A16]/85">
                  {data.xiu}
                  {data.xiuLuck ? `（${data.xiuLuck}）` : ''}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEO 详细解析 */}
        <section className="px-4 max-w-3xl mx-auto py-12 md:py-16 text-[#1C1A16]/75 leading-relaxed">
          <h2 className="font-display text-2xl font-semibold text-[#1C1A16] mb-4">
            如何看懂今日黄历？
          </h2>
          <p className="mb-4">
            黄历宜忌的判断并非凭空而来。它综合了当日的天干地支组合、建除十二神（建、除、满、平、定、执、破、危、成、收、开、闭）的轮值、吉神凶煞的分布，以及二十八星宿的位置。今天是
            <span className="font-medium text-[#1C1A16]"> {data.dayGanzhi} </span>
            日，建除属
            <span className="font-medium text-[#1C1A16]"> {data.zhiXing} </span>
            ，值日星宿为
            <span className="font-medium text-[#1C1A16]"> {data.xiu} </span>
            ，整体能量决定了今日的宜忌结构。
          </p>
          <p className="mb-4">
            阅读黄历时，先看"宜"和"忌"两栏的具体事项，对照你今天准备做的事即可快速判断；再看冲煞——
            如果你属
            <span className="font-medium text-[#1C1A16]"> {data.chongShengxiao} </span>
            ，今天就属于"被冲"的生肖，重大决定建议延后或借助吉时化解。
          </p>

          <h2 className="font-display text-2xl font-semibold text-[#1C1A16] mt-10 mb-4">
            今天适合的具体事项
          </h2>
          <p className="mb-4">
            根据今日黄历，
            {data.yi.length > 0
              ? `适合的事项有：${data.yi.slice(0, 6).join('、')}等。这些都是与今日五行能量相协调的活动，做起来更顺手、更容易出结果。`
              : '今日黄历未列特别"宜"事，属相对平和的一天，做日常事务、按部就班推进工作较为合适。'}
          </p>
          <p className="mb-4">
            如果你正在考虑结婚、开业、签约、出行、动土等重要事项，除了看黄历通用宜忌，更建议结合自己的
            <Link href="/bazi" className="text-[#C75B4B] underline-offset-4 hover:underline">
              生辰八字
            </Link>
            一起判断。同样的"宜嫁娶"日子，对不同八字的人吉凶力度并不相同。
          </p>

          <h2 className="font-display text-2xl font-semibold text-[#1C1A16] mt-10 mb-4">
            今天需要避免的事项
          </h2>
          <p className="mb-4">
            {data.ji.length > 0
              ? `黄历提示今日忌：${data.ji.slice(0, 6).join('、')}等。这些事项与当日干支气场冲突，容易遇阻或反复，建议优先避开或推迟。`
              : '今日黄历未列特别"忌"事，整体能量较为温和，但仍建议保持谨慎，避免冲动决策。'}
          </p>
          <p className="mb-4">
            对于属
            <span className="font-medium text-[#1C1A16]"> {data.chongShengxiao} </span>
            的朋友，今日为冲日，重要场合建议低调处理；其他人则可以正常行事，但仍以"宜""忌"两栏为主要参考。
          </p>
        </section>

        {/* 相关工具推荐 */}
        <section className="px-4 max-w-3xl mx-auto pb-12 md:pb-16">
          <h2 className="font-display text-xl font-semibold text-[#1C1A16] mb-6">
            继续探索
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/huangli"
              className="block rounded-xl bg-white border border-[#1C1A16]/8 p-5 hover:border-[#C75B4B]/40 transition-colors"
            >
              <div className="text-base font-semibold text-[#1C1A16] mb-1">完整黄历查询 →</div>
              <div className="text-sm text-[#1C1A16]/60">查看任意日期的宜忌、吉时、神煞详情。</div>
            </Link>
            <Link
              href="/bazi"
              className="block rounded-xl bg-white border border-[#1C1A16]/8 p-5 hover:border-[#C75B4B]/40 transition-colors"
            >
              <div className="text-base font-semibold text-[#1C1A16] mb-1">八字分析 →</div>
              <div className="text-sm text-[#1C1A16]/60">结合生辰八字判断今日对你的具体吉凶。</div>
            </Link>
            <Link
              href="/daily"
              className="block rounded-xl bg-white border border-[#1C1A16]/8 p-5 hover:border-[#C75B4B]/40 transition-colors"
            >
              <div className="text-base font-semibold text-[#1C1A16] mb-1">今日运势 →</div>
              <div className="text-sm text-[#1C1A16]/60">基于个人八字的每日运势提示。</div>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 max-w-3xl mx-auto pb-16 border-t border-[#1C1A16]/8 pt-10">
          <h2 className="font-display text-xl font-semibold text-[#1C1A16] mb-6">常见问题</h2>
          <dl className="space-y-5 text-sm leading-relaxed">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question}>
                <dt className="font-semibold text-[#1C1A16]">{item.question}</dt>
                <dd className="mt-1 text-[#1C1A16]/70">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Footer />
      </main>
    </>
  );
}
