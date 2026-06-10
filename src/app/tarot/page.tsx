import type { Metadata } from 'next'
import PageClient from './PageClient'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'

export const metadata: Metadata = {
  title: '塔罗牌占卜 | 赛博命理师 CyberFate — AI 解读塔罗',
  description: '在线免费塔罗牌占卜，支持单张抽牌、三牌阵、凯尔特十字等多种牌阵。AI 深度解读正逆位含义，结合问题场景给出感情、事业、财运方向指引。',
  keywords: ['塔罗牌', '塔罗占卜', '免费塔罗', 'AI塔罗', '塔罗抽牌', '凯尔特十字', '塔罗三牌阵', '塔罗牌解读', '感情塔罗', '塔罗测算'],
  alternates: { canonical: 'https://www.cyberfate.me/tarot' },
  openGraph: { title: '塔罗牌占卜 | 赛博命理师 CyberFate', description: '在线免费塔罗牌占卜，AI 深度解读正逆位含义，感情事业财运。', type: 'website', url: 'https://www.cyberfate.me/tarot' },
}

const FAQ_ITEMS = [
  {
    question: '塔罗牌真的准吗？',
    answer: '塔罗牌不是预言工具，而是一面映照内心的镜子。它通过原型符号激发潜意识对当下处境的洞察，帮助你梳理思路、看清盲区。塔罗的"准"在于触动内心共鸣与提供新的视角，而非给出确定的未来答案。',
  },
  {
    question: '塔罗牌的逆位是什么意思？',
    answer: '逆位是塔罗牌牌面上下颠倒的状态。它通常代表牌意的削弱、阻塞、内化或反向呈现，比如正位的"力量"代表勇气与掌控，逆位则可能暗示自我怀疑或失控。逆位让解读层次更丰富，但并非简单的"凶"。',
  },
  {
    question: '同一个问题一天可以抽几次牌？',
    answer: '建议同一问题一天只抽一次。反复抽牌往往源于内心的焦虑与不确定，反而会让牌意混乱、失去指引价值。塔罗给出的答案需要时间消化与行动验证，不妨先沉淀几天再考虑是否重新提问。',
  },
]

export default function TarotPage() {
  return (
    <>
      <FaqJsonLd items={FAQ_ITEMS} />
      <PageClient />
      <section aria-label="关于塔罗占卜" className="mx-auto max-w-3xl px-4 py-12 text-[#1C1A16]/60 text-sm leading-relaxed border-t border-[#1C1A16]/8 mt-8">
        <h2 className="text-base font-semibold text-[#1C1A16] mb-4">关于塔罗占卜</h2>
        <p className="mb-3">塔罗牌的现代雏形可追溯至 15 世纪意大利北部宫廷，最初是贵族娱乐的纸牌游戏，后逐渐与神秘学传统融合，演化为占卜工具。19 世纪末，黄金黎明协会与韦特对塔罗体系进行了系统整合，形成了今天最广为流传的韦特塔罗结构。荣格分析心理学进一步赋予了塔罗"原型符号"的现代意义。</p>
        <p className="mb-3">完整的塔罗牌共 78 张，分为大阿尔卡纳（22 张）与小阿尔卡纳（56 张）。大阿尔卡纳从愚者到世界，描绘灵魂成长的完整旅程，对应人生重大议题；小阿尔卡纳分为权杖、圣杯、宝剑、金币四个花色，对应火水风土四元素，反映日常生活的具体情境。两者结合，构成完整的人生映射体系。</p>
        <p className="mb-3">CyberFate 塔罗占卜支持单张抽牌、三牌阵（过去-现在-未来）、凯尔特十字等多种牌阵选择。AI 解读结合传统牌意、正逆位含义、牌阵位置语境与你的具体问题场景，给出贴合实际的方向指引。相比静态的牌意词条，AI 解读能更灵活地应对个性化情境，让塔罗咨询更具实用价值。</p>
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
