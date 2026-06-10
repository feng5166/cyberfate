import type { Metadata } from 'next'
import PageClient from './PageClient'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'

export const metadata: Metadata = {
  title: '梅花易数占卜 | 赛博命理师 CyberFate — AI 起卦解卦',
  description: '在线梅花易数起卦占卜，支持时间起卦、数字起卦、报数起卦等多种方式。AI 解读本卦、互卦、变卦三才结构，结合体用关系与应期，预测事物吉凶与发展趋势。',
  keywords: ['梅花易数', '梅花易数占卜', '梅花起卦', '易数', '邵雍', '起卦', '卦象解读', '体用', '互卦', '变卦', '免费占卜'],
  alternates: { canonical: 'https://www.cyberfate.me/meihua' },
  openGraph: { title: '梅花易数占卜 | 赛博命理师 CyberFate', description: 'AI 起卦解卦，本卦互卦变卦三才结构，预测吉凶趋势。', type: 'website', url: 'https://www.cyberfate.me/meihua' },
}

const FAQ_ITEMS = [
  {
    question: '梅花易数和六爻有什么区别？',
    answer: '两者都是基于《周易》六十四卦的占卜方法，但起卦与解卦思路不同。梅花易数侧重"心易"，灵活运用时间、数字、外应起卦，以体用关系与五行生克解卦；六爻则采用三枚铜钱六次摇卦，配以纳甲、世应、动爻等结构化推演。梅花更轻巧灵动，六爻更系统严谨。',
  },
  {
    question: '梅花易数的起卦方法多吗？',
    answer: '相当多。常见的有时间起卦（年月日时）、数字起卦（任意两组数字）、声音起卦、方位起卦、外应起卦（观察当时所见的物象）等。邵雍的核心思想是"万物皆可起卦"，关键在于动念瞬间的"机"，体现了梅花易数"心易"的灵活精髓。',
  },
  {
    question: '同一件事可以反复起卦吗？',
    answer: '不建议。梅花易数讲究"心诚则灵"，第一次起卦时心念最为纯净专注，所得卦象最具参考价值。反复起卦容易因心绪干扰得出矛盾结果，反而失去判断依据。建议先认真理解第一次卦象的指引，待事态有新进展后再重新占问。',
  },
]

export default function MeihuaPage() {
  return (
    <>
      <FaqJsonLd items={FAQ_ITEMS} />
      <PageClient />
      <section aria-label="关于梅花易数" className="mx-auto max-w-3xl px-4 py-12 text-[#1C1A16]/60 text-sm leading-relaxed border-t border-[#1C1A16]/8 mt-8">
        <h2 className="text-base font-semibold text-[#1C1A16] mb-4">关于梅花易数</h2>
        <p className="mb-3">梅花易数相传为北宋大儒邵雍（邵康节）所创，是《周易》体系中以"心易"为核心的占卜方法。相传邵雍观梅花飞落而悟得起卦之法，故名梅花易数。它打破了传统起卦对工具的依赖，主张"万物皆可起卦"——时间、数字、声音、方位、外应皆可成卦，关键在于动念瞬间的诚意与直觉。</p>
        <p className="mb-3">梅花易数的解卦体系以"体用"关系为核心。起卦得到的本卦分为体卦与用卦：体为求测者自身，用为所测之事。通过体用之间的五行生克与卦象之间的互卦、变卦推演，结合三才结构（天人地）综合分析事物发展。整个体系以简驭繁，强调灵感与逻辑并重。</p>
        <p className="mb-3">CyberFate 的梅花易数支持多种起卦方式：时间起卦自动取当前年月日时数据，数字起卦让你输入任意两组数字，AI 会精准排出本卦、互卦、变卦的完整结构，并基于体用生克关系、应期推算、三才呈象等多维度给出解读，让传统易数智慧以更直观的方式呈现，辅助你看清当下处境与未来走向。</p>
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
