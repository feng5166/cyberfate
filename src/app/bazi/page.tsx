import type { Metadata } from 'next'
import PageClient from './PageClient'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: '八字命理分析 | 赛博命理师 CyberFate — AI 四柱推算',
  description: '免费在线八字命理分析，输入生辰八字，AI 深度解读五行强弱、日主特征、十神含义、事业财运方向、感情婚姻走势。融合传统命理体系与现代 AI 技术，提供科学理性的八字分析参考。',
  keywords: ['八字分析', '八字命理', '四柱八字', '生辰八字', 'AI算命', '五行分析', '日主', '十神', '八字排盘', '免费算命', '命理分析', '八字免费测算'],
  alternates: { canonical: 'https://www.cyberfate.me/bazi' },
  openGraph: { title: '八字命理分析 | 赛博命理师 CyberFate', description: '输入生辰八字，AI 深度解读五行、日主、事业财运、感情婚姻。', type: 'website', url: 'https://www.cyberfate.me/bazi' },
  twitter: {
    card: 'summary',
    title: '八字命理分析 | CyberFate',
    description: '免费在线八字命理分析，输入生辰八字，AI 深度解读五行强弱、日主特征、十神含义、事业财运方向、感情婚姻走势。',
  },
}

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '八字命理分析 - CyberFate',
  url: 'https://www.cyberfate.me/bazi',
  description: '免费在线八字命理分析，AI 深度解读五行强弱、日主特征、十神含义、事业财运方向、感情婚姻走势。',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
  inLanguage: 'zh-CN',
  publisher: { '@type': 'Organization', name: 'CyberFate', url: 'https://www.cyberfate.me' },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <FaqJsonLd items={FAQ_ITEMS} />
      <PageClient />
      <Footer>
      <section aria-label="关于八字命理" className="mx-auto max-w-3xl px-4 py-12 text-[#1C1A16]/60 text-sm leading-relaxed border-t border-[#1C1A16]/8 mt-8">
        <h2 className="text-base font-semibold text-[#1C1A16] mb-4">关于八字命理</h2>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">八字命理的历史渊源</h3>
        <p className="mb-3">八字命理学的思想源头可追溯至《尚书·洪范》提出的五行学说，奠定了金木水火土相生相克的哲学基础。汉代《白虎通》进一步将干支纪年与阴阳五行结合，使命理推演具备了完整的符号系统。</p>
        <p className="mb-3">真正系统化的论命方法始于唐代李虚中，他以年月日三柱论命，开创了以干支推算人生命运的先河。五代宋初徐子平加入时柱，形成了四柱八字的完整体系，故八字术也常称"子平术"，沿用至今。</p>
        <p className="mb-3">明清两代，《三命通会》《渊海子平》《滴天髓》《穷通宝鉴》等经典相继成书，将八字理论推向集大成阶段。流传逾千年，八字命理已成为中华文化中本土化最完整、影响最深远的命理预测体系。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">八字的基本构成原理</h3>
        <p className="mb-3">八字由年、月、日、时四柱组成，每柱各有一个天干与一个地支，共计八个字，故称八字。天干十个（甲乙丙丁戊己庚辛壬癸），地支十二个（子丑寅卯辰巳午未申酉戌亥），分别对应十二生肖。</p>
        <p className="mb-3">天干地支两两相配，按顺序排列形成六十甲子循环，每六十年一个完整周期。这一循环不仅用于纪年，还用于纪月、纪日、纪时，构成了精确到时辰的时间坐标系统，是八字排盘的数学骨架。</p>
        <p className="mb-3">准确排盘需结合万年历换算农历节气，并根据出生地的经度做真太阳时修正。仅依靠身份证上的钟表时间排盘容易出现时辰错位，进而影响整个命局的判断基础与流年推演的准确性。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">五行与十神：命理分析的核心工具</h3>
        <p className="mb-3">五行金、木、水、火、土之间存在相生（金生水、水生木、木生火、火生土、土生金）与相克（金克木、木克土、土克水、水克火、火克金）的复杂关系。命局中五行的强弱分布，直接反映先天禀赋与性格倾向。</p>
        <p className="mb-3">十神是日主与其他七个字之间的关系符号，包括比肩、劫财、食神、伤官、偏财、正财、七杀、正官、偏印、正印共十种。它们象征命主与外部世界的互动模式，涵盖性格、人际、事业、财富、婚姻等全方位信息。</p>
        <p className="mb-3">日主代表命主自身，其强弱决定了命局的喜用神方向。日主偏弱需要扶助，偏强则需克泄，喜用神的判断是格局分析与流年吉凶推断的核心依据，也是衡量八字水平高低的关键所在。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">大运流年：命运的时间轴</h3>
        <p className="mb-3">大运每十年一换，代表人生不同阶段的主旋律。大运由月柱推出，根据日主阴阳与性别决定顺排或逆排，起运岁数由出生时间距离最近节气的天数精确计算得出，体现命运的阶段性节奏。</p>
        <p className="mb-3">流年则每年一换，与大运叠加形成具体年份的吉凶信息。大运是宏观背景，流年是微观触发，两者结合才能呈现某一具体时间段的运势走向，单独看任何一方都不足以判断当下处境。</p>
        <p className="mb-3">流年与命局原局的天干地支会产生刑冲合害等复杂作用，可能激发或压制原本的格局倾向。这正是为何同样的八字在不同年份会有截然不同的人生际遇，时间维度是命理分析不可或缺的层面。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">CyberFate 八字 AI 分析的特点</h3>
        <p className="mb-3">平台支持全国主要城市的真太阳时自动修正，避免传统排盘因时区与地理位置造成的时辰偏差。万年历底层数据覆盖近现代完整时间区间，排盘精度可达分钟级别，确保命盘起点的正确性。</p>
        <p className="mb-3">AI 解读突破了传统命书"词条式"堆砌的局限，结合命局整体的五行结构、十神组合、大运背景等多维信息，给出个性化的叙事性分析，而非生硬的吉凶判词或机械的格局贴标签。</p>
        <p className="mb-3">分析模块覆盖性格特征、事业财运、感情婚姻、健康提醒、流年趋势五大维度，既适合作为自我认知的参考工具，也可在人生重大决策前提供另一种思考视角，让传统命理在现代语境中焕发新意义。</p>

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
              { name: '合婚测算', href: '/bazi/marriage' },
              { name: '每日运势', href: '/daily' },
              { name: '紫微斗数', href: '/ziwei' },
              { name: '老黄历', href: '/huangli' },
            ].map((t) => (
              <a key={t.href} href={t.href} className="text-xs px-3 py-1.5 rounded-full border border-[#1C1A16]/15 text-[#1C1A16]/60 hover:text-[#1C1A16] hover:border-[#1C1A16]/30 transition-colors">
                {t.name}
              </a>
            ))}
          </div>
        </div>
      </section>
      </Footer>
    </>
  )
}
