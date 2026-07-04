// 2026 生肖运势子页共享渲染层。
// 说明：财/事业/爱情三个子页原为 ~448 行复制克隆，此文件抽出其重复的展示组件，
// 统一走项目设计系统 token（brand-accent 强调 / brand-ink 墨色 / font-display 标题）。
// 这是 2026 域内部模块，非 UI 原子层；仅承载展示，不含任何业务逻辑与数据。
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { PageShell } from '@/components/ui/PageShell';

export interface ZodiacFortune {
  name: string;
  emoji: string;
  rank: number;
  stars: number;
  reason: string;
  detail: string;
  advice: string;
}

/** 五星评分（强调色实心 + 墨色淡底） */
export function StarRating({ count }: { count: number }) {
  return (
    <span className="text-brand-accent tracking-wider" aria-label={`${count}星`}>
      {'★'.repeat(count)}
      <span className="text-brand-ink/15">{'★'.repeat(5 - count)}</span>
    </span>
  );
}

/** 页首：恒定眉标「2026 · 丙午马年」+ 标题 + 引导语 */
export function RankingHero({ title, desc }: { title: string; desc: string }) {
  return (
    <section className="pt-12 sm:pt-16 md:pt-20 pb-10">
      <PageShell className="text-center">
        <p className="text-sm tracking-[0.3em] text-brand-accent mb-4">2026 · 丙午马年</p>
        <h1 className="font-display text-3xl sm:text-5xl text-brand-ink mb-5 leading-tight">
          {title}
        </h1>
        <p className="text-base text-brand-gray leading-relaxed">{desc}</p>
      </PageShell>
    </section>
  );
}

/** 段落眉标 + 主标题（居中） */
export function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center mb-8">
      <p className="text-sm tracking-[0.2em] text-brand-gray">{eyebrow}</p>
      <h2 className="font-display text-2xl text-brand-ink mt-2">{title}</h2>
    </div>
  );
}

/** TOP3 三甲卡片 */
export function Top3Cards({ items }: { items: ZodiacFortune[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((z) => (
        <Card
          key={z.name}
          hover={false}
          className="relative overflow-hidden border border-brand-accent/20 bg-brand-accent-soft"
        >
          <div className="absolute top-3 right-4 text-brand-accent/25 font-display text-7xl leading-none select-none">
            {z.rank}
          </div>
          <div className="relative">
            <div className="text-5xl mb-3">{z.emoji}</div>
            <h3 className="font-display text-2xl text-brand-ink mb-1">{z.name}</h3>
            <div className="mb-3 text-base">
              <StarRating count={z.stars} />
            </div>
            <p className="font-display text-base text-brand-accent mb-3">{z.reason}</p>
            <p className="text-sm text-brand-gray leading-relaxed">{z.detail}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

/** 12 生肖完整排行表（静态展示，非可点行——不做伪装交互） */
export function RankingTable({ items }: { items: ZodiacFortune[] }) {
  return (
    <Card hover={false} className="p-0 overflow-hidden">
      <div className="divide-y divide-brand-border-light">
        {items.map((z) => (
          <div
            key={z.name}
            className="grid grid-cols-12 items-center gap-4 px-5 py-4"
          >
            <div className="col-span-1 text-xl text-brand-light font-display">{z.rank}</div>
            <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
              <span className="text-2xl">{z.emoji}</span>
              <span className="font-display text-base text-brand-ink">{z.name}</span>
            </div>
            <div className="col-span-3 sm:col-span-2 text-sm">
              <StarRating count={z.stars} />
            </div>
            <div className="col-span-12 sm:col-span-7 text-sm text-brand-gray leading-relaxed">
              <span className="text-brand-accent font-medium">{z.reason}</span>
              <span className="text-brand-light"> — </span>
              <span>{z.advice}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** 各生肖详解列表 */
export function ZodiacDetailList({ items }: { items: ZodiacFortune[] }) {
  return (
    <div className="space-y-6">
      {items.map((z) => (
        <div key={z.name} className="border-l-2 border-brand-accent/40 pl-5">
          <h3 className="font-display text-xl text-brand-ink mb-2 flex items-center gap-3">
            <span className="text-2xl">{z.emoji}</span>
            <span>{z.name}</span>
            <span className="text-base"><StarRating count={z.stars} /></span>
          </h3>
          <p className="text-sm text-brand-gray leading-relaxed mb-2">{z.detail}</p>
          <p className="text-xs text-brand-accent">建议：{z.advice}</p>
        </div>
      ))}
    </div>
  );
}

/** 相关维度导航 */
export function RelatedRankings({
  links,
}: {
  links: { href: string; title: string; desc: string }[];
}) {
  return (
    <Card hover={false}>
      <h3 className="font-display text-xl text-brand-ink mb-4">查看其他维度的2026年生肖运势</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="border border-brand-border rounded-lg p-4 hover:border-brand-accent transition-colors"
          >
            <div className="font-display text-base text-brand-ink mb-1">{l.title}</div>
            <div className="text-brand-gray text-xs">{l.desc}</div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

/** 八字引导 CTA（深墨卡 + 强调色按钮） */
export function BaziCtaCard({ title, desc }: { title: string; desc: string }) {
  return (
    <Card
      hover={false}
      className="bg-gradient-to-br from-brand-ink to-[#3A2F23] text-white border-0 shadow-xl text-center"
    >
      <h3 className="font-display text-2xl sm:text-3xl mb-3">{title}</h3>
      <p className="text-sm text-white/75 mb-6 leading-relaxed">{desc}</p>
      <Link
        href="/bazi"
        className="inline-flex items-center justify-center min-h-[46px] px-[38px] py-[14px] text-[13px] tracking-[0.08em] bg-brand-accent text-white rounded-lg hover:bg-brand-accent-hover transition-colors font-medium"
      >
        免费做八字详细分析 →
      </Link>
    </Card>
  );
}

/** 常见问题 */
export function FaqSection({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <>
      <h2 className="font-display text-2xl text-brand-ink mb-6 text-center">常见问题</h2>
      <div className="space-y-4">
        {items.map((it) => (
          <Card key={it.question} hover={false}>
            <h3 className="font-display text-base text-brand-ink mb-2">{it.question}</h3>
            <p className="text-sm text-brand-gray leading-relaxed">{it.answer}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
