import type { Metadata } from 'next'
import PageClient from './PageClient'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'

export const metadata: Metadata = {
  title: '六爻占卜 | 赛博命理师 CyberFate — AI 纳甲六爻预测',
  description: '在线六爻占卜，AI 模拟三枚铜钱摇卦，精准排出本卦变卦，配以纳甲六亲世应。深度解读用神动爻、空亡冲合、应期推算，预测事业、感情、财运吉凶走势。',
  keywords: ['六爻', '六爻占卜', '六爻预测', '纳甲', '世应', '动爻', '六亲', '京房易', '卦象解读', '免费六爻', 'AI六爻'],
  alternates: { canonical: 'https://www.cyberfate.me/liuyao' },
  openGraph: { title: '六爻占卜 | 赛博命理师 CyberFate', description: 'AI 纳甲六爻预测，深度解读用神动爻、应期推算。', type: 'website', url: 'https://www.cyberfate.me/liuyao' },
  twitter: {
    card: 'summary',
    title: '六爻占卜 | CyberFate',
    description: '在线六爻占卜，AI 模拟三枚铜钱摇卦，精准排出本卦变卦，配以纳甲六亲世应。深度解读用神动爻、应期推算。',
  },
}

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '六爻占卜 - CyberFate',
  url: 'https://www.cyberfate.me/liuyao',
  description: '在线六爻占卜，AI 模拟三枚铜钱摇卦，精准排出本卦变卦，深度解读用神动爻、应期推算。',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
  inLanguage: 'zh-CN',
  publisher: { '@type': 'Organization', name: 'CyberFate', url: 'https://www.cyberfate.me' },
}

const FAQ_ITEMS = [
  {
    question: '六爻和梅花易数有什么区别？',
    answer: '两者同源于《周易》，但路径风格不同。六爻有完整的纳甲体系，配以六亲、世应、动爻、空亡等结构化要素，推演严谨细致，擅长具体事项的吉凶应期；梅花易数则更灵活直觉，强调心易与体用生克。简而言之，六爻偏理论严谨，梅花偏直觉灵动。',
  },
  {
    question: '六爻占卜的准确率高吗？',
    answer: '六爻在传统占卜中以推演细致著称，对具体事项的判断（成与不成、吉凶应期）具有较强指引性。但准确率受多重因素影响：起卦诚心、用神判定、动爻取舍、解卦经验等。占卜本质是辅助决策工具，提供视角与提示，不应取代理性思考与行动。',
  },
  {
    question: '同一件事可以反复占卜吗？',
    answer: '一般不建议。古人有"卜不过三"之说，重复占卜不仅心绪不专影响准确度，也容易因结果不如意而反复求问，失去占卜的本意。建议给第一次的卦象足够时间消化与验证，待事态有实质变化后再重新起卦更为妥当。',
  },
]

export default function LiuyaoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <FaqJsonLd items={FAQ_ITEMS} />
      <PageClient />
      <section aria-label="关于六爻占卜" className="mx-auto max-w-3xl px-4 py-12 text-[#1C1A16]/60 text-sm leading-relaxed border-t border-[#1C1A16]/8 mt-8">
        <h2 className="text-base font-semibold text-[#1C1A16] mb-4">关于六爻占卜</h2>
        <p className="mb-3">六爻占卜源自《周易》，是基于六十四卦体系的传统预测方法。其完整体系由西汉京房奠定，他将天干地支、五行、六亲等要素纳入卦爻，开创了"纳甲"体系，使原本抽象的卦象具备了系统化推演的可能。后经历代易学家发展，明清时期《卜筮正宗》等典籍进一步完善了六爻预测的理论框架。</p>
        <p className="mb-3">六爻起卦的传统方法是用三枚铜钱摇卦六次，根据每次正反面组合得到老阴、少阴、少阳、老阳四种爻象，从下至上累积形成本卦与变卦。每一爻按照纳甲法配上天干地支，并依据卦宫五行确定六亲（父母、兄弟、子孙、官鬼、妻财），再标出世爻与应爻，构成完整的解卦结构。</p>
        <p className="mb-3">六爻解卦的核心在于用神选取与动爻分析。世爻代表自身，应爻代表他人或对方，根据所问之事确定用神所在的六亲位置（如问财以妻财为用、问工作以官鬼为用），结合动爻、空亡、月建日辰对用神的生克冲合，推演事情的吉凶成败与应期。CyberFate 的 AI 六爻基于精准的纳甲算法与解卦逻辑，让传统六爻预测对现代用户更易理解。</p>
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
              { name: '梅花易数', href: '/meihua' },
              { name: '八字分析', href: '/bazi' },
              { name: '塔罗占卜', href: '/tarot' },
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
