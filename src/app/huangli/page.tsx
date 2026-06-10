import type { Metadata } from 'next'
import PageClient from './PageClient'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'

export const metadata: Metadata = {
  title: 'AI老黄历 | 赛博命理师 CyberFate — 每日宜忌吉时查询',
  description: '每日老黄历查询，宜忌、吉神、凶煞一目了然，AI 结合黄历智慧解答具体问事。传统黄历文化与现代 AI 结合，让每日决策更有参考依据。',
  keywords: ['老黄历', '黄历', '今日黄历', '宜忌', '吉时', '黄历查询', '万年历', '今天黄历', 'AI问事', '黄历宜忌', '吉日查询'],
  alternates: { canonical: 'https://www.cyberfate.me/huangli' },
  openGraph: { title: 'AI老黄历 | 赛博命理师 CyberFate', description: '每日黄历查询，宜忌吉时，AI 结合黄历智慧解答具体问事。', type: 'website', url: 'https://www.cyberfate.me/huangli' },
  twitter: {
    card: 'summary',
    title: 'AI老黄历 | CyberFate',
    description: '每日老黄历查询，宜忌、吉神、凶煞一目了然，AI 结合黄历智慧解答具体问事。',
  },
}

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'AI老黄历 - CyberFate',
  url: 'https://www.cyberfate.me/huangli',
  description: '每日老黄历查询，宜忌吉时一目了然，AI 结合黄历智慧解答具体问事。',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
  inLanguage: 'zh-CN',
  publisher: { '@type': 'Organization', name: 'CyberFate', url: 'https://www.cyberfate.me' },
}

const FAQ_ITEMS = [
  {
    question: '黄历的宜忌每天都不一样吗？',
    answer: '是的。黄历宜忌主要依据建除十二神（建、除、满、平、定、执、破、危、成、收、开、闭）轮值与当日干支组合，每天的吉神凶煞分布不同，因此宜忌内容也随之变化。这种循环规律来自传统天文历法体系。',
  },
  {
    question: '结婚选日子真的有用吗？',
    answer: '从命理传统来看，择日是为了让重要事件与天时能量相契合，避开冲克自己生辰八字的日子。即使从心理学角度看，慎重选择吉日也能增添仪式感与心理稳定性。建议结合双方八字与黄历宜忌综合考虑。',
  },
  {
    question: 'AI 问事和传统黄历查询有什么不同？',
    answer: '传统黄历给出的是固定的"宜结婚"、"忌动土"等通用条目，AI 问事则可以针对你的具体问题（如"今天适合谈合作吗"）结合当日黄历信息、五行能量与具体场景给出更细致的判断与建议，让黄历指导更具针对性。',
  },
]

export default function HuangliPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <FaqJsonLd items={FAQ_ITEMS} />
      <PageClient />
      <section aria-label="关于老黄历" className="mx-auto max-w-3xl px-4 py-12 text-[#1C1A16]/60 text-sm leading-relaxed border-t border-[#1C1A16]/8 mt-8">
        <h2 className="text-base font-semibold text-[#1C1A16] mb-4">关于老黄历</h2>
        <p className="mb-3">老黄历又称通书、皇历，是中国传统社会用于指导日常决策的择日文化集大成者。其根基是干支纪时体系——天干地支六十甲子循环，配合二十四节气、七十二候、二十八星宿、建除十二神等多重历法元素。清乾隆年间编纂的《协纪辨方书》是现代黄历的重要规范来源。</p>
        <p className="mb-3">黄历宜忌的判断依据相当复杂。建除十二神按照"建除满平定执破危成收开闭"的顺序每日轮值，配合当日的天干地支、神煞分布（如天德、月德、岁破、月破等）、值日星宿等要素，综合得出当日适宜与忌讳的事项。一些重要事件如嫁娶、安葬、动土，还要进一步避开冲煞自身生肖与命主的日子。</p>
        <p className="mb-3">CyberFate 的 AI 老黄历不仅展示每日完整的宜忌、吉神、凶煞、冲煞、吉时信息，还融入了 AI 智能问事功能。当你面对一个具体决策时，比如"今天适合签合同吗"、"明天出行可以吗"，AI 会综合当日黄历能量与你的问题情境，给出更贴合实际的判断建议，让传统择日智慧更易于被现代生活所用。</p>
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
