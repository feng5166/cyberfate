import type { Metadata } from 'next'
import PageClient from './PageClient'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'

export const metadata: Metadata = {
  title: '紫微斗数排盘 | 赛博命理师 CyberFate — AI 命盘解读',
  description: '在线紫微斗数排盘，AI 解读十二宫位星曜组合，分析命宫、财帛宫、官禄宫、夫妻宫、迁移宫等核心宫位，全面呈现命运格局与人生走势。',
  keywords: ['紫微斗数', '紫微排盘', '紫微命盘', '斗数', '十二宫位', '命盘解读', '紫微星', '紫微斗数免费', '命盘分析', '紫微斗数在线排盘'],
  alternates: { canonical: 'https://www.cyberfate.me/ziwei' },
  openGraph: { title: '紫微斗数排盘 | 赛博命理师 CyberFate', description: 'AI 解读十二宫位星曜组合，全面呈现命运格局与人生走势。', type: 'website', url: 'https://www.cyberfate.me/ziwei' },
}

const FAQ_ITEMS = [
  {
    question: '紫微斗数和八字有什么区别？',
    answer: '两者都是基于出生时间的命理体系，但分析路径不同。八字以天干地支与五行生克为核心，更擅长分析能量与趋势；紫微斗数以星曜入宫为核心，通过十二宫位的星曜组合更直观地呈现人生不同领域的具体格局。两者可互为补充。',
  },
  {
    question: '命宫坐紫微星就是好命吗？',
    answer: '紫微星是斗数中的帝王之星，命宫见紫微通常代表领导气质与尊贵格局，但是否真的"好命"还需结合三方四正的星曜组合、四化飞星、宫位力量等综合判断。单看一颗主星不足以下结论，紫微星见煞或落陷反而可能格局欠佳。',
  },
  {
    question: '怎么看自己的命格高低？',
    answer: '紫微斗数中的命格判断需要综合命宫主星组合、三方四正的辅佐星、四化飞星的引动方向以及十二宫整体平衡。常见的格局如"紫府同宫"、"机月同梁"、"杀破狼"等各有特色，并无绝对优劣，关键在于格局是否成立、是否被破坏。',
  },
]

export default function ZiweiPage() {
  return (
    <>
      <FaqJsonLd items={FAQ_ITEMS} />
      <PageClient />
      <section aria-label="关于紫微斗数" className="mx-auto max-w-3xl px-4 py-12 text-[#1C1A16]/60 text-sm leading-relaxed border-t border-[#1C1A16]/8 mt-8">
        <h2 className="text-base font-semibold text-[#1C1A16] mb-4">关于紫微斗数</h2>
        <p className="mb-3">紫微斗数相传由五代宋初的陈希夷（陈抟）所创，是中国传统命理学中体系最为精密的一支。它以紫微星为核心，结合一百多颗虚星与实星，按照特定算法落入命主的十二宫位，构建出立体的命盘。相比八字的抽象推演，紫微斗数的星曜与宫位结构更直观，被誉为"东方占星学"。</p>
        <p className="mb-3">紫微斗数的十四颗主星各具特色：紫微为帝王之星，天府为南斗主星，太阳太阴主光明与情感，武曲主财，廉贞主桃花与权谋，天同主福，七杀破军贪狼合称杀破狼主开创变动，巨门主口舌与暗，天梁天机主思考谋略，天相主辅佐。每颗主星入不同宫位与会照不同辅佐星，会形成截然不同的命格表现。</p>
        <p className="mb-3">十二宫位涵盖人生的方方面面：命宫主自我特质，兄弟、夫妻、子女、财帛、疾厄、迁移、交友（仆役）、官禄（事业）、田宅、福德、父母十二宫各司其职。CyberFate 的 AI 紫微斗数排盘基于精准的农历转换与起盘算法，结合四化飞星与三方四正的会照关系，由 AI 深度解读各宫位的星曜组合，呈现完整的命运图景。</p>
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
