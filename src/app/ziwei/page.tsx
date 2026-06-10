import type { Metadata } from 'next'
import PageClient from './PageClient'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'

export const metadata: Metadata = {
  title: '紫微斗数排盘 | 赛博命理师 CyberFate — AI 命盘解读',
  description: '在线紫微斗数排盘，AI 解读十二宫位星曜组合，分析命宫、财帛宫、官禄宫、夫妻宫、迁移宫等核心宫位，全面呈现命运格局与人生走势。',
  keywords: ['紫微斗数', '紫微排盘', '紫微命盘', '斗数', '十二宫位', '命盘解读', '紫微星', '紫微斗数免费', '命盘分析', '紫微斗数在线排盘'],
  alternates: { canonical: 'https://www.cyberfate.me/ziwei' },
  openGraph: { title: '紫微斗数排盘 | 赛博命理师 CyberFate', description: 'AI 解读十二宫位星曜组合，全面呈现命运格局与人生走势。', type: 'website', url: 'https://www.cyberfate.me/ziwei' },
  twitter: {
    card: 'summary',
    title: '紫微斗数排盘 | CyberFate',
    description: '在线紫微斗数排盘，AI 解读十二宫位星曜组合，分析命宫、财帛宫、官禄宫、夫妻宫、迁移宫等核心宫位。',
  },
}

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '紫微斗数排盘 - CyberFate',
  url: 'https://www.cyberfate.me/ziwei',
  description: '在线紫微斗数排盘，AI 解读十二宫位星曜组合，分析命宫、财帛宫、官禄宫、夫妻宫、迁移宫等核心宫位。',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
  inLanguage: 'zh-CN',
  publisher: { '@type': 'Organization', name: 'CyberFate', url: 'https://www.cyberfate.me' },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <FaqJsonLd items={FAQ_ITEMS} />
      <PageClient />
      <section aria-label="关于紫微斗数" className="mx-auto max-w-3xl px-4 py-12 text-[#1C1A16]/60 text-sm leading-relaxed border-t border-[#1C1A16]/8 mt-8">
        <h2 className="text-base font-semibold text-[#1C1A16] mb-4">关于紫微斗数</h2>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">紫微斗数的历史与地位</h3>
        <p className="mb-3">紫微斗数相传由五代宋初的道家人物陈希夷（陈抟老祖）所创，最初藏于道家秘传，未广泛流传。南宋以后逐渐外传，明清时期出现《紫微斗数全书》《紫微斗数捷览》等经典著作，初步形成系统化的命理体系。</p>
        <p className="mb-3">20 世纪后期，紫微斗数在台湾、香港地区由王亭之、紫云、慧心斋主等命理学家深入研究与推广，逐渐发扬光大，并衍生出中州派、三合派、四化派、飞星派等不同流派，各有侧重，呈现百家争鸣之势。</p>
        <p className="mb-3">与八字的抽象干支推演不同，紫微斗数体系精密、星曜繁多（主辅杂曜逾百颗），通过星曜入宫呈现具体的人生格局，被誉为"东方占星学"。它与八字互为补充：八字擅长能量趋势推演，紫微擅长宫位格局呈现。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">十四主星各司其职</h3>
        <p className="mb-3">北斗七星包括紫微（帝王之星，主尊贵领导）、天机（智谋之星，主灵动思考）、太阳（光明之星，主男性长辈与事业）、武曲（财富之星，主刚毅与财帛）、天同（福气之星，主享乐与情感）、廉贞（次桃花，主权谋变化）、天府（财库之星，主稳重保守）。</p>
        <p className="mb-3">南斗六星包括太阴（主情感、女性、内敛）、贪狼（主欲望、多才多艺与桃花）、巨门（暗曜，主口舌、研究与深思）、天相（辅佐印绶之星，主忠诚与协调）、天梁（荫庇之星，主清高与解厄）、七杀（主权威与开创）。</p>
        <p className="mb-3">破军为北斗末星，主大破大立与变革。七杀、破军、贪狼三星合称"杀破狼"，组合出现于命宫、迁移宫、官禄宫时主激进开创型命格，人生起伏较大但易成大局，是斗数中最具特色的格局之一。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">十二宫位：人生各领域的全景图</h3>
        <p className="mb-3">紫微斗数将命盘划分为十二宫位，分别对应人生不同领域。命宫主自我特质与人生总论，夫妻宫主婚姻感情走势，财帛宫主金钱收入来源，官禄宫主事业方向与社会成就，这四宫并称四大核心宫位。</p>
        <p className="mb-3">迁移宫主出门运势与外地发展机会，福德宫反映精神状态、兴趣爱好与享福能力，田宅宫主不动产与家庭环境，疾厄宫预示健康状况与潜在体质风险，这四宫同样是判断生活质量的重要参考维度。</p>
        <p className="mb-3">三方四正是紫微斗数判断命格的基础框架。以命宫为本宫，对宫（迁移）与三合宫（财帛、官禄）共四个宫位构成命运的核心力场。任何一宫的解读都不能孤立看待，必须考量三方四正的会照影响。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">四化飞星：命盘的动态引擎</h3>
        <p className="mb-3">四化指化禄、化权、化科、化忌。化禄主增益顺遂与财富机会，化权主掌控权威与执行力，化科主名声学识与贵人助力，化忌主阻滞暗耗与潜在冲突。每个天干引动四颗星曜化出四化，是命盘动态变化的核心机制。</p>
        <p className="mb-3">流年太岁会引动当年的流年四化，与本命盘的星曜产生叠加效应，是年度运势预测的核心工具。例如本命财帛宫化禄入命宫，又遇流年再次引动，则财运能量被进一步放大，呈现显著的财富机会。</p>
        <p className="mb-3">自化（宫位星曜自身四化）与飞化（他宫星曜飞入本宫）构成更复杂的交叉影响。四化派与飞星派紫微斗数特别注重这一层动态分析，能更精确地推演事件的因果链条与发生时间节点。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">CyberFate 紫微斗数 AI 的特点</h3>
        <p className="mb-3">平台支持输入精确出生地，自动完成节气校正与农历换算，避免传统排盘因地区时差与历法误差导致的宫位错位问题。底层算法兼容中州派与三合派的主流起盘规则，确保命盘的传统正统性。</p>
        <p className="mb-3">AI 解读聚焦三方四正与关键宫位，避免传统命书"逐宫堆砌星曜词条"的机械式呈现。解读会综合主星组合、辅佐星会照、四化引动等多维信息，给出贴合个体的整体性叙事，而非生硬的吉凶标签。</p>
        <p className="mb-3">分析模块覆盖命格总论、事业财运、感情婚姻、健康迁移四大方向，既可作为人生关键决策的参考视角，也适合长期自我观照与成长规划，让千年命理智慧在现代生活中找到具体落点。</p>

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
