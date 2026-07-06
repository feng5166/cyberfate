// 2026 生肖运势子页共享渲染层。
// 说明：财/事业/爱情三个子页原为 ~448 行复制克隆，此文件抽出其重复的展示组件，
// 统一走站点视觉设计系统（docs/DESIGN-SYSTEM.md）：标准白卡 + 2026 模块点缀色。
// 这是 2026 域内部模块，非 UI 原子层；仅承载展示，不含任何业务逻辑与数据。
import Link from 'next/link';
import { PageShell } from '@/components/ui/PageShell';

// 2026 生肖模块点缀色（设计系统 §2.2 唯一映射）
export const Y2026_BG = '#FEF3C7';
export const Y2026_FG = '#B45309';

export interface ZodiacFortune {
  name: string;
  emoji: string;
  rank: number;
  stars: number;
  reason: string;
  detail: string;
  advice: string;
}

/** 五星评分（模块主色实心 + 墨色淡底） */
export function StarRating({ count }: { count: number }) {
  return (
    <span className="tracking-wider" style={{ color: Y2026_FG }} aria-label={`${count}星`}>
      {'★'.repeat(count)}
      <span className="text-brand-ink/15">{'★'.repeat(5 - count)}</span>
    </span>
  );
}

/** 细线罗盘装饰（品牌母题，≤6% 透明度；父容器需 relative + overflow-hidden） */
function CompassDeco({ className }: { className: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute ${className}`}>
      <svg viewBox="0 0 400 400" className="h-full w-full">
        <circle cx="200" cy="200" r="196" fill="none" stroke="#1C1A16" strokeWidth="1" />
        <circle cx="200" cy="200" r="150" fill="none" stroke="#1C1A16" strokeWidth="0.6" />
        <circle cx="200" cy="200" r="100" fill="none" stroke="#1C1A16" strokeWidth="0.6" strokeDasharray="2 4" />
        {Array.from({ length: 24 }, (_, i) => (
          <line
            key={i}
            x1="200" y1="4" x2="200" y2={i % 2 === 0 ? 14 : 9}
            stroke="#1C1A16" strokeWidth="1"
            transform={`rotate(${i * 15} 200 200)`}
          />
        ))}
      </svg>
    </div>
  );
}

/** 页首：模块色眉标「2026 · 丙午马年」+ 居中 H1 + /55 副标题 + 罗盘细线装饰 */
export function RankingHero({ title, desc }: { title: string; desc: string }) {
  return (
    <section className="relative overflow-hidden pt-12 sm:pt-16 md:pt-20 pb-10">
      <CompassDeco className="left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-[0.05] md:h-[560px] md:w-[560px]" />
      <PageShell className="relative text-center">
        <p className="mb-5">
          <span
            className="inline-flex items-center rounded-full px-4 py-1.5 text-[12.5px] font-medium tracking-[0.25em]"
            style={{ background: Y2026_BG, color: Y2026_FG }}
          >
            2026 · 丙午马年
          </span>
        </p>
        <h1 className="font-display text-3xl md:text-[40px] font-bold text-brand-ink mb-4 leading-tight tracking-[0.08em]">
          {title}
        </h1>
        <p className="text-sm md:text-base text-[#1C1A16]/55 tracking-wider leading-relaxed">{desc}</p>
      </PageShell>
    </section>
  );
}

/** 段落眉标（模块主色）+ 主标题（居中） */
export function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center mb-8">
      <p className="text-xs tracking-[0.25em]" style={{ color: Y2026_FG }}>{eyebrow}</p>
      <h2 className="font-display text-2xl md:text-3xl text-brand-ink mt-2">{title}</h2>
    </div>
  );
}

/** TOP3 三甲卡片（标准白卡 + 模块色名次水印/星级/理由） */
export function Top3Cards({ items }: { items: ZodiacFortune[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {items.map((z) => (
        <div
          key={z.name}
          className="relative overflow-hidden rounded-2xl border border-[#1C1A16]/8 bg-white p-7"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute top-4 right-5 font-display text-7xl leading-none select-none"
            style={{ color: Y2026_FG, opacity: 0.12 }}
          >
            {z.rank}
          </span>
          <div className="relative">
            <div className="text-5xl mb-3">{z.emoji}</div>
            <h3 className="font-display text-2xl text-brand-ink mb-1">{z.name}</h3>
            <div className="mb-3 text-base">
              <StarRating count={z.stars} />
            </div>
            <p className="font-display text-base mb-3" style={{ color: Y2026_FG }}>{z.reason}</p>
            <p className="text-sm text-[#1C1A16]/70 leading-relaxed">{z.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 12 生肖完整排行表（静态展示，非可点行——不做伪装交互） */
export function RankingTable({ items }: { items: ZodiacFortune[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#1C1A16]/8 bg-white">
      <div className="divide-y divide-[#1C1A16]/6">
        {items.map((z) => (
          <div
            key={z.name}
            className="grid grid-cols-12 items-center gap-4 px-5 py-4"
          >
            <div className="col-span-1 font-display text-xl text-brand-ink/30">{z.rank}</div>
            <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
              <span className="text-2xl">{z.emoji}</span>
              <span className="font-display text-base text-brand-ink">{z.name}</span>
            </div>
            <div className="col-span-3 sm:col-span-2 text-sm">
              <StarRating count={z.stars} />
            </div>
            <div className="col-span-12 sm:col-span-7 text-sm text-[#1C1A16]/70 leading-relaxed">
              <span className="font-medium" style={{ color: Y2026_FG }}>{z.reason}</span>
              <span className="text-brand-ink/25"> — </span>
              <span>{z.advice}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 各生肖详解列表（模块色左线 + 建议） */
export function ZodiacDetailList({ items }: { items: ZodiacFortune[] }) {
  return (
    <div className="space-y-6">
      {items.map((z) => (
        <div key={z.name} className="border-l-2 pl-5" style={{ borderColor: `${Y2026_FG}59` }}>
          <h3 className="font-display text-xl text-brand-ink mb-2 flex items-center gap-3">
            <span className="text-2xl">{z.emoji}</span>
            <span>{z.name}</span>
            <span className="text-base"><StarRating count={z.stars} /></span>
          </h3>
          <p className="text-sm text-[#1C1A16]/70 leading-relaxed mb-2">{z.detail}</p>
          <p className="text-xs" style={{ color: Y2026_FG }}>建议：{z.advice}</p>
        </div>
      ))}
    </div>
  );
}

/** 相关维度导航（3 卡网格 + hover 浮起 + 模块色顶条） */
export function RelatedRankings({
  links,
}: {
  links: { href: string; title: string; desc: string }[];
}) {
  return (
    <div>
      <h3 className="font-display text-xl text-brand-ink mb-5 text-center">查看其他维度的2026年生肖运势</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group relative overflow-hidden rounded-2xl border border-[#1C1A16]/8 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
              style={{ background: Y2026_FG }}
            />
            <div className="font-display text-base text-brand-ink mb-1">{l.title}</div>
            <div className="text-xs text-[#1C1A16]/55">{l.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** 八字引导 CTA（白卡收尾：左文右钮 + 罗盘纹理半出血，见首页终版） */
export function BaziCtaCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1C1A16]/8 bg-white px-8 md:px-12 py-10 md:py-12">
      <CompassDeco className="-right-24 top-1/2 h-[280px] w-[280px] -translate-y-1/2 opacity-[0.06] md:h-[360px] md:w-[360px]" />
      <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-display text-2xl md:text-3xl text-brand-ink leading-snug">{title}</h3>
          <p className="text-sm text-[#1C1A16]/60 mt-3 leading-relaxed">{desc}</p>
        </div>
        <div className="shrink-0 text-center">
          <Link
            href="/bazi"
            className="inline-flex items-center justify-center min-h-[46px] px-[38px] py-[14px] text-[13px] tracking-[0.08em] bg-brand-accent text-white rounded-lg hover:bg-brand-accent-hover transition-colors font-semibold"
          >
            免费做八字详细分析 →
          </Link>
        </div>
      </div>
    </div>
  );
}

/** 常见问题（details 手风琴，与首页/人生K线页同语言） */
export function FaqSection({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <>
      <h2 className="font-display text-2xl md:text-3xl text-brand-ink mb-6 text-center">常见问题</h2>
      <div className="space-y-3">
        {items.map((it) => (
          <details
            key={it.question}
            className="group rounded-2xl border border-[#1C1A16]/8 bg-white px-6 py-4"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-brand-ink [&::-webkit-details-marker]:hidden">
              {it.question}
              <span aria-hidden className="shrink-0 text-lg leading-none text-brand-ink/40 transition-transform duration-300 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="text-sm text-[#1C1A16]/70 leading-relaxed mt-3">{it.answer}</p>
          </details>
        ))}
      </div>
    </>
  );
}
