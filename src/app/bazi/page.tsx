import type { Metadata } from 'next'
import PageClient from './PageClient'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'

export const metadata: Metadata = {
  title: '八字命理分析 | 赛博命理师 CyberFate — AI 四柱推算',
  description: '免费在线八字命理分析，输入生辰八字，AI 深度解读五行强弱、日主特征、十神含义、事业财运方向、感情婚姻走势。融合传统命理体系与现代 AI 技术，提供科学理性的八字分析参考。',
  keywords: ['八字分析', '八字命理', '四柱八字', '生辰八字', 'AI算命', '五行分析', '日主', '十神', '八字排盘', '免费算命', '命理分析', '八字免费测算'],
  alternates: { canonical: 'https://www.cyberfate.me/bazi' },
  openGraph: { title: '八字命理分析 | 赛博命理师 CyberFate', description: '输入生辰八字，AI 深度解读五行、日主、事业财运、感情婚姻。', type: 'website', url: 'https://www.cyberfate.me/bazi' },
}

const FAQ_ITEMS = [
  {
    question: '八字和生辰八字是一样的吗？',
    answer: '是同一个概念。八字即生辰八字，由出生年、月、日、时四柱的天干地支组成，每柱两字共八个字，故称八字。它是中国传统命理学推算命运的基础数据。',
  },
  {
    question: '八字五行缺什么怎么看？',
    answer: '统计八字中金、木、水、火、土五种元素的数量，缺失或薄弱的即为五行所缺。但更重要的是结合日主强弱、十神格局综合判断喜用神，单纯补缺并不一定有利，需要根据命局整体平衡来看。',
  },
  {
    question: '八字可以改变命运吗？',
    answer: '八字反映的是先天禀赋与人生趋势，本身无法被改变，但可以通过认识自己的优劣势，主动调整方向、把握时机、改善行为习惯，从而影响命运的走向。八字分析的价值在于自我认知与决策参考。',
  },
]

export default function BaziPage() {
  return (
    <>
      <FaqJsonLd items={FAQ_ITEMS} />
      <PageClient />
      <section aria-label="关于八字命理" className="mx-auto max-w-3xl px-4 py-12 text-[#1C1A16]/60 text-sm leading-relaxed border-t border-[#1C1A16]/8 mt-8">
        <h2 className="text-base font-semibold text-[#1C1A16] mb-4">关于八字命理</h2>
        <p className="mb-3">八字命理学，又称四柱预测学，是中国传统命理体系中影响最深远的一支。其雏形源自唐代李虚中以年月日三柱论命，至五代徐子平加入时柱形成完整的四柱八字体系，故八字术也常称"子平术"。八字以出生年、月、日、时的天干地支为基础数据，通过五行生克与十神关系推演命局。</p>
        <p className="mb-3">五行是八字分析的核心概念，金、木、水、火、土之间存在相生相克的关系。十神（比肩、劫财、食神、伤官、偏财、正财、七杀、正官、偏印、正印）则反映了命主与外部世界的互动模式，揭示性格、事业、财运、婚姻等多维信息。日主代表命主自身，日主强弱是判断命局格局与喜用神的关键。</p>
        <p className="mb-3">CyberFate 的 AI 八字分析融合了传统命理体系与现代自然语言推理能力。系统会基于精准的万年历排盘，计算出四柱八字、大运流年，并通过 AI 深度解读，从五行平衡、日主特征、十神组合、宫位星象等维度，为你呈现性格特征、事业方向、感情婚姻、财运健康的全方位分析。</p>
        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">常见问题</h3>
        <dl className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question}>
              <dt className="font-medium text-[#1C1A16]/80">{item.question}</dt>
              <dd className="mt-1">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}
