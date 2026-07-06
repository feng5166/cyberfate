import type { Metadata } from 'next'
import PageClient from './PageClient'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: '人生K线 | 赛博命理师 CyberFate — 八字百年运势可视化',
  description: '免费在线人生K线图，基于八字命理推算 1 岁到 100 岁的百年运势，用金融K线的视角直观呈现大运流年起伏节奏。查看最佳十年、运势巅峰与低谷，AI 命理师在线解读。',
  keywords: ['人生K线', '运势K线', '百年运势', '八字运势图', '大运流年', '运势曲线', '一生运势', 'AI算命', '八字排盘', '运势可视化'],
  alternates: { canonical: 'https://www.cyberfate.me/life-kline' },
  openGraph: { title: '人生K线 | 赛博命理师 CyberFate', description: '基于八字命理的百年运势可视化，用金融K线的视角呈现大运流年起伏。', type: 'website', url: 'https://www.cyberfate.me/life-kline' },
  twitter: {
    card: 'summary',
    title: '人生K线 | CyberFate',
    description: '基于八字命理推算百年运势，用金融K线直观呈现一生的起伏节奏。',
  },
}

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '人生K线 - CyberFate',
  url: 'https://www.cyberfate.me/life-kline',
  description: '基于八字命理推算 1 岁到 100 岁的百年运势，用金融K线的视角直观呈现大运流年起伏节奏。',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
  inLanguage: 'zh-CN',
  publisher: { '@type': 'Organization', name: 'CyberFate', url: 'https://www.cyberfate.me' },
}

const FAQ_ITEMS = [
  {
    question: '什么是人生K线？',
    answer: '人生K线是将传统八字命理与金融K线图结合的运势可视化工具。它以出生八字为基础，逐年推算大运与流年对命局的作用，把每一年的运势起伏画成一根K线，让您像看股票走势一样直观地了解一生的运势节奏。',
  },
  {
    question: '如何看懂人生K线图？',
    answer: '每根K线代表一年：绿色（阳线）表示当年运势较上年上升，红色（阴线）表示下降；K线上下的细线表示当年运势的最高点和最低点，波动越大说明当年起伏越明显。橙色曲线是十年均线（MA10），反映十年维度的大趋势。',
  },
  {
    question: '人生K线准确吗？',
    answer: '人生K线基于传统八字命理的确定性算法生成，同一出生信息得到的K线永远一致。但命理分析属于传统文化范畴，结果仅供参考与娱乐，不构成任何人生决策依据，人生走向更多取决于个人的努力与选择。',
  },
  {
    question: '换大运时运势会有什么变化？',
    answer: '八字命理中每十年为一步大运，换大运意味着影响命局的主要力量发生更替，运势基调可能明显转变。K线图上换运之年的振幅会加大，前后十年的整体高度也常有台阶式变化。',
  },
]

export default function LifeKlinePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <FaqJsonLd items={FAQ_ITEMS} />
      <PageClient />
      <Footer>
        <section aria-label="关于人生K线" className="mx-auto max-w-3xl px-4 py-12 text-[#1C1A16]/60 text-sm leading-relaxed border-t border-[#1C1A16]/8 mt-8">
          <h2 className="text-base font-semibold text-[#1C1A16] mb-4">关于人生K线</h2>

          <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">用金融视角看命理</h3>
          <p className="mb-3">K线图诞生于日本江户时代的米市交易，后成为全球金融市场通用的行情语言。人生K线借用这一模型：把一年的运势起伏浓缩为开盘、收盘、最高、最低四个数值，涨跌与振幅一目了然，让抽象的命理概念有了直观的形状。</p>
          <p className="mb-3">与股票不同，人生K线的数据源不是市场报价，而是八字命理的确定性推演——大运定十年基调，流年定当年起伏，喜用神定吉凶方向。同一份出生信息，永远得到同一条K线。</p>

          <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">大运与流年如何影响K线</h3>
          <p className="mb-3">八字命理以十年为一步大运，大运的五行若契合命局喜用神，这十年的K线整体走高；若助长忌神，则整体承压。流年则在大运的基调上叠加年度波动，流年地支与命局刑冲会合越剧烈，当年K线的影线（振幅）越长。</p>
          <p className="mb-3">换大运之年往往是K线的转折点：主导命局的力量发生更替，运势可能出现台阶式的跃升或回落。这正是人生K线最有价值的信息——提前看到节奏的变化，高峰期积极进取，低谷期稳健蓄力。</p>

          <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">理性看待运势预测</h3>
          <p className="mb-3">人生K线是传统文化与数据可视化结合的探索，仅供参考与娱乐。命理描述的是先天的势能分布，而人生的高度最终取决于认知、努力与选择。愿这张图成为您思考人生节奏的一面镜子，而非束缚脚步的枷锁。</p>
        </section>
      </Footer>
    </>
  )
}
