import type { Metadata } from 'next'
import PageClient from './PageClient'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'

export const metadata: Metadata = {
  title: '今日运势 | 赛博命理师 CyberFate — 每日八字运势分析',
  description: '基于八字命理推算今日运势，实时分析综合运势、事业运、财运、感情运、健康运五维度。AI 结合日主与当日天干地支，为你提供个性化的每日运势参考。',
  keywords: ['今日运势', '每日运势', '八字运势', '日运', '今天运势怎么样', '运势分析', '每日星座运势', '今日宜忌', '运势查询', '免费运势'],
  alternates: { canonical: 'https://www.cyberfate.me/daily' },
  openGraph: { title: '今日运势 | 赛博命理师 CyberFate', description: '基于八字命理推算今日运势，AI 结合日主与当日天干地支。', type: 'website', url: 'https://www.cyberfate.me/daily' },
  twitter: {
    card: 'summary',
    title: '今日运势 | CyberFate',
    description: '基于八字命理推算今日运势，实时分析综合运势、事业运、财运、感情运、健康运五维度。',
  },
}

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '今日运势 - CyberFate',
  url: 'https://www.cyberfate.me/daily',
  description: '基于八字命理推算今日运势，AI 结合日主与当日天干地支，提供个性化每日运势参考。',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
  inLanguage: 'zh-CN',
  publisher: { '@type': 'Organization', name: 'CyberFate', url: 'https://www.cyberfate.me' },
}

const FAQ_ITEMS = [
  {
    question: '为什么每天的运势会变化？',
    answer: '每日运势的核心是命主日主与当日天干地支的五行生克关系。由于日干日支每天都在轮转，与日主形成的喜忌关系也随之变化，所以每天的运势状态自然不同。这正是日运区别于流月、流年运势的特点。',
  },
  {
    question: '没有出生时间可以测每日运势吗？',
    answer: '可以。仅有出生年月日也能进行基础的日运推算，因为日主主要由出生日的天干决定。但若要获得更精准的综合运势分析，建议尽量提供出生时辰，因为时柱会影响命局格局与十神组合。',
  },
  {
    question: '运势低迷的时候应该怎么办？',
    answer: '运势低迷不必恐慌，可以将其视为休整与积累的窗口期。建议减少重大决策、避免冒险投资、注意身心健康，把精力放在内在提升上。命理分析的价值在于提示而非决定，主动调整心态与行为才是关键。',
  },
]

export default function DailyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <FaqJsonLd items={FAQ_ITEMS} />
      <PageClient />
      <section aria-label="关于每日运势" className="mx-auto max-w-3xl px-4 py-12 text-[#1C1A16]/60 text-sm leading-relaxed border-t border-[#1C1A16]/8 mt-8">
        <h2 className="text-base font-semibold text-[#1C1A16] mb-4">关于每日运势</h2>
        <p className="mb-3">每日运势的推算原理建立在八字命理体系之上。命主的日干（日主）代表自身能量，而每一天都有对应的天干地支组合，两者之间通过五行的生克制化形成动态关系。当日干支与命主喜用神契合时，运势趋于顺畅；与忌神冲克时，运势则相对低迷。这是日运区别于通俗星座运势的根本所在。</p>
        <p className="mb-3">CyberFate 每日运势从五个维度呈现当日状态：综合运势反映整体能量趋势，事业运指向工作决策与人际协作的吉凶，财运提示求财方向与投资风险，感情运涉及人际亲密关系的互动质量，健康运则关注身心状态的微妙变化。五维指标共同构建出一日内可参考的能量地图。</p>
        <p className="mb-3">与依据出生月份的星座运势不同，八字日运基于精确到日的命主信息进行个性化推算，每个人在同一天的运势可以截然不同。AI 结合日主特征、当日干支、五行平衡等多重因素综合分析，让每日运势真正"千人千面"，为你的当日决策与行动提供更具针对性的参考。</p>
        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">常见问题</h3>
        <dl className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question}>
              <dt className="font-medium text-[#1C1A16]/80">{item.question}</dt>
              <dd className="mt-1">{item.answer}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 pt-6 border-t border-[#1C1A16]/8">
          <p className="text-xs font-medium text-[#1C1A16]/50 mb-3">相关工具</p>
          <div className="flex flex-wrap gap-2">
            {[
              { name: '八字分析', href: '/bazi' },
              { name: '紫微斗数', href: '/ziwei' },
              { name: '老黄历', href: '/huangli' },
              { name: '合婚测算', href: '/bazi/marriage' },
            ].map((t) => (
              <a key={t.href} href={t.href} className="text-xs px-3 py-1.5 rounded-full border border-[#1C1A16]/15 text-[#1C1A16]/60 hover:text-[#1C1A16] hover:border-[#1C1A16]/30 transition-colors">
                {t.name}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
