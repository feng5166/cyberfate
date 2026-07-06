import type { Metadata } from 'next';
import { MarriagePageClient } from './MarriagePageClient';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: '八字合婚测算 | 赛博命理师 CyberFate — AI 婚配分析',
  description: '免费在线八字合婚测算，输入双方生辰八字，AI 分析五行匹配度、十神关系、命盘相合度，从命理角度给出婚配建议。支持男女双方生辰八字合婚、姓名合婚参考。',
  keywords: ['八字合婚', '合婚测算', '生辰八字合婚', '婚配测算', '免费合婚', '八字配对', 'AI合婚', '婚姻测算', '合婚分析', '八字婚配'],
  alternates: { canonical: 'https://www.cyberfate.me/bazi/marriage' },
  openGraph: {
    title: '八字合婚测算 | 赛博命理师 CyberFate',
    description: '输入双方生辰八字，AI 分析五行匹配度与命盘相合度，给出婚配参考。',
    type: 'website',
    url: 'https://www.cyberfate.me/bazi/marriage',
  },
  twitter: {
    card: 'summary',
    title: '八字合婚测算 | CyberFate',
    description: '输入双方生辰八字，AI 分析五行匹配度与命盘相合度。',
  },
};

const FAQ_ITEMS = [
  {
    question: '八字合婚真的准吗？',
    answer: '八字合婚是传统命理的重要参考工具，通过分析双方五行匹配、十神关系、命盘能量互动来评估婚配契合度。它不是绝对的"准或不准"，而是提供一个从命理角度的参考维度，帮助你更全面地了解两人关系的优势与挑战。',
  },
  {
    question: '八字不合就一定不能在一起吗？',
    answer: '不是。八字合婚只是参考，现实中八字"不合"的夫妻白头偕老的案例比比皆是。命理分析更多是帮助了解双方性格磁场的差异，提前做好心理准备，而非给感情判死刑。后天的经营与磨合才是婚姻长久的关键。',
  },
  {
    question: '合婚需要知道对方的出生时辰吗？',
    answer: '知道出生时辰可以分析时柱，让合婚更完整准确。如果不知道时辰，可以选择"不知道时辰"，系统会基于年月日三柱进行分析，准确度略有降低但仍有参考价值。',
  },
];

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '八字合婚测算 - CyberFate',
  url: 'https://www.cyberfate.me/bazi/marriage',
  description: '免费在线八字合婚测算，AI 分析双方五行匹配度、十神关系、命盘相合度。',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
  inLanguage: 'zh-CN',
  publisher: { '@type': 'Organization', name: 'CyberFate', url: 'https://www.cyberfate.me' },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

export default function MarriagePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <MarriagePageClient />
      <Footer>
      <section
        aria-label="关于八字合婚"
        className="mx-auto max-w-3xl px-4 py-12 text-[#1C1A16]/60 text-sm leading-relaxed border-t border-[#1C1A16]/8 mt-8"
      >
        <h2 className="text-base font-semibold text-[#1C1A16] mb-4">关于八字合婚</h2>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">八字合婚的历史渊源</h3>
        <p className="mb-3">八字合婚，又称"婚配测算"或"合八字"，是中国传统婚俗中历史最为悠久的婚前参考仪式之一。其历史可追溯至唐宋时期，至明清已成为上至皇室贵族、下至平民百姓的普遍习俗。古人婚嫁"父母之命，媒妁之言"的时代，算命先生的合婚批语往往是决定婚事与否的重要依据。</p>
        <p className="mb-3">传统合婚的核心是"生辰八字"——即男女双方出生的年、月、日、时所对应的天干地支八个字。通过对比双方八字中五行的强弱、十神的关系、日主的性格属性，来评估两人在性格磁场、财运互动、健康影响等方面的契合程度。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">五行匹配：合婚的核心维度</h3>
        <p className="mb-3">五行匹配是合婚分析的第一个核心维度。两人命局中的五行如果能够相互补益——如一方五行缺水，另一方水旺——往往代表双方在能量层面能够互补，有利于长期相处的和谐稳定。反之，若两人命局五行高度重叠（同向强旺），则在某些方面容易产生竞争或内耗。</p>
        <p className="mb-3">典型的五行互补组合包括：火命与水命的相激（挑战中的成长）、木命与金命的相克（棱角磨合）、土命与木命的制化（稳定中的活力）。每种组合都有其独特的相处模式与成长课题。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">十神关系：性格与角色的互动</h3>
        <p className="mb-3">十神是八字合婚中判断感情走向的重要工具。男命中"正财"代表正缘妻子的信息，女命中"正官"代表正缘丈夫的信息。看对方的日干是否符合自己命局中正财或正官的属性，是最直接的合婚判断之一。</p>
        <p className="mb-3">除了正缘星，十神之间的生克关系也揭示了双方的互动模式：食神遇正财主温馨顾家；伤官见官主感情波折；比劫旺见财主竞争压力等。专业合婚不是简单配对，而是透过十神关系读懂两人未来相处的"剧本"。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">地支关系：命盘的深层共鸣</h3>
        <p className="mb-3">地支的刑冲会合是合婚的进阶维度。两人命盘中出现大量的地支"合"（如子丑合、寅亥合）通常代表缘分深厚、吸引力强；出现"冲"（如子午冲、卯酉冲）则代表两人性格上的直接对立，相处需要更多包容与磨合。三合局（如寅午戌）的出现意味着双方在某一五行上形成强大的共同能量场，是合婚中的加分项。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">CyberFate AI 合婚的特点</h3>
        <p className="mb-3">CyberFate 的 AI 合婚分析整合了五行匹配度评分、十神关系解读、地支刑冲合害分析、男女命盘命宫/夫妻宫信息等多个维度，通过 AI 综合研判，生成结构化的合婚报告。报告涵盖整体契合度评分、性格磁场分析、财运互动、感情走势预测及婚后注意事项，帮助你从命理视角全面了解这段关系。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">常见问题</h3>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group rounded-xl border border-[#1C1A16]/8 bg-white px-5 py-4">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-medium text-[#1C1A16]">
                {item.question}
                <span aria-hidden className="text-[#1C1A16]/40 group-open:rotate-180 transition-transform">⌄</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[#1C1A16]/65">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
      </Footer>
    </>
  );
}
