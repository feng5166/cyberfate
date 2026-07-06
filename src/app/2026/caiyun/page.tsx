import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { PageShell } from '@/components/ui/PageShell';
import { Footer } from '@/components/layout/Footer';
import { FaqJsonLd } from '@/components/seo/FaqJsonLd';
import {
  RankingHero,
  SectionHead,
  Top3Cards,
  RankingTable,
  ZodiacDetailList,
  RelatedRankings,
  BaziCtaCard,
  FaqSection,
  type ZodiacFortune,
} from '../_shared';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: '2026年财运最旺的生肖排行 | CyberFate — 丙午马年运势',
  description:
    '2026丙午马年，哪些生肖财运最旺？从命理角度解析12生肖2026年财运强弱排行，结合五行相生相克给出实用开运建议。',
  keywords: [
    '2026年财运',
    '2026生肖财运',
    '丙午年财运',
    '马年财运',
    '2026年最旺生肖',
    '生肖财运排行',
    '2026十二生肖运势',
    '寅午戌三合',
    '午未六合',
    '财运开运',
  ],
  alternates: { canonical: 'https://www.cyberfate.me/2026/caiyun' },
  openGraph: {
    title: '2026年财运最旺的生肖排行 | CyberFate',
    description:
      '2026丙午马年，从五行命理角度解析12生肖财运强弱排行，给出实用开运建议。',
    type: 'article',
    url: 'https://www.cyberfate.me/2026/caiyun',
  },
  twitter: {
    card: 'summary',
    title: '2026年财运最旺的生肖排行 | CyberFate',
    description: '2026丙午马年财运排行：羊、虎、蛇、兔、狗稳居前列。',
  },
};

const zodiacs: ZodiacFortune[] = [
  {
    name: '生肖羊',
    emoji: '🐏',
    rank: 1,
    stars: 5,
    reason: '午未六合，财星入命',
    detail:
      '羊与马构成午未六合，2026年生肖羊与流年太岁形成最和谐的配置。未土中藏丁火、乙木、己土，与丙午年丁火当令完美呼应，财星活跃。投资机会增多，副业财源广开，尤其适合主动出击拓展商业关系。',
    advice: '宜主动投资、扩展副业、发展人脉。忌冒进借贷。',
  },
  {
    name: '生肖虎',
    emoji: '🐯',
    rank: 2,
    stars: 5,
    reason: '寅午戌三合火局，火生土利财',
    detail:
      '寅午戌三合火局在2026年因午火当令而完整成立，生肖虎得三合之利，气场极强。虎为木，木生火、火生土，财星层层流转。偏财运极佳，意外之财、投资回报、奖金分红都有机会。是2026年财运最值得期待的生肖之一。',
    advice: '宜把握偏财机会、果断投资、积极理财。忌过度自信。',
  },
  {
    name: '生肖蛇',
    emoji: '🐍',
    rank: 3,
    stars: 4,
    reason: '巳午同气，得天独厚',
    detail:
      '巳火与午火同气连枝，2026年生肖蛇与流年保持火势相助的格局。主动财运表现突出，靠自己的努力与判断获取收益。适合从事销售、谈判、项目主导等需要主动出击的工作。正财稳定增长，偏财亦有惊喜。',
    advice: '宜主动谈判、推进合作、争取项目。忌被动等待。',
  },
  {
    name: '生肖兔',
    emoji: '🐰',
    rank: 4,
    stars: 4,
    reason: '卯木生午火，木火通明',
    detail:
      '卯木生午火，木火通明的格局让生肖兔在2026年财路顺畅。木为生发之气，火为光明之象，象征着创意和才华能转化为实际收益。文创、教育、咨询、设计等行业的属兔人士，今年大有可为。',
    advice: '宜发挥才华、做内容变现、签长期合约。忌短线投机。',
  },
  {
    name: '生肖狗',
    emoji: '🐶',
    rank: 5,
    stars: 4,
    reason: '午戌半合火，贵人财运同步',
    detail:
      '午戌半合火局，生肖狗在2026年得贵人提携。戌土收纳火气，象征着财富的积累与稳固。贵人运与财运同步到来，往往因为一次相遇、一次推荐而打开新的财源。适合通过人际关系拓展事业版图。',
    advice: '宜结交贵人、参加聚会、主动求助。忌闭门造车。',
  },
  {
    name: '生肖马',
    emoji: '🐴',
    rank: 6,
    stars: 3,
    reason: '本命年伏吟，收入波动',
    detail:
      '2026年是马年生肖马的本命年，午午自刑伏吟，能量过旺反而带来波动。收入水平不会下降，但起伏较大，月度差异明显。适合稳定的工作和收入来源，不宜大举扩张或做高风险投资。佩戴红色饰物可化解伏吟之煞。',
    advice: '宜守不宜博，稳定现有收入。忌创业、借贷、高风险投资。',
  },
  {
    name: '生肖龙',
    emoji: '🐲',
    rank: 7,
    stars: 3,
    reason: '辰土厚实，火生土',
    detail:
      '辰土为湿土，能很好地承接午火的能量，火生土的格局让生肖龙2026年走稳健理财路线。不是大富大贵之年，但是财富稳步积累的好时机。适合配置稳健型资产，定投、储蓄、保险都是不错的选择。',
    advice: '宜稳健理财、定投储蓄、配置保险。忌激进投资。',
  },
  {
    name: '生肖牛',
    emoji: '🐮',
    rank: 8,
    stars: 3,
    reason: '丑土稳重，正财稳定',
    detail:
      '丑土厚重稳定，与午火无直接刑冲合害，生肖牛2026年财运平稳。正财表现稳定，工资、奖金按部就班。偏财机会一般，不必强求。适合在本职工作上深耕，提升专业能力，为来年布局。',
    advice: '宜深耕主业、提升能力、稳健储蓄。忌频繁跳槽。',
  },
  {
    name: '生肖猴',
    emoji: '🐵',
    rank: 9,
    stars: 2,
    reason: '申金被午火克制，财运起伏',
    detail:
      '午火克申金，生肖猴在2026年财运受压。原本聪明灵活的猴子，今年容易因冲动决策而损失。投资上忌冒险，工作上忌跳槽。建议保守过渡，等待明年丁未年金气回归。',
    advice: '宜保守理财、控制支出、避免投机。忌冒险跳槽。',
  },
  {
    name: '生肖鸡',
    emoji: '🐔',
    rank: 10,
    stars: 2,
    reason: '酉金火克，财运偏弱',
    detail:
      '午火克酉金，生肖鸡2026年财运偏弱。容易出现意料之外的支出，如医疗、维修、人情往来等。建议提前规划预算，做好风险准备。本职工作收入稳定即可，不宜大动作。',
    advice: '宜守成、做预算、备应急金。忌冲动消费。',
  },
  {
    name: '生肖猪',
    emoji: '🐷',
    rank: 11,
    stars: 2,
    reason: '亥午相害，财运损耗',
    detail:
      '亥水与午火形成"亥午害"，生肖猪2026年财运有损耗。容易因合作纠纷、合同问题、信任错位而损失财富。建议所有合作书面化，签合同要慎重。健康问题也可能间接影响财运。',
    advice: '宜书面合作、谨慎签约、关注健康。忌口头承诺、轻信他人。',
  },
  {
    name: '生肖鼠',
    emoji: '🐭',
    rank: 12,
    stars: 1,
    reason: '子午冲，财运压制最重',
    detail:
      '2026年子午相冲，生肖鼠是冲太岁的生肖，财运受压制最为明显。容易遇到大额意外支出、投资亏损、收入断档等情况。建议全年保守，不做重大财务决策，多做储蓄少做投资，等待2027年丁未年化解。',
    advice: '宜全面保守、增加储蓄、化解冲煞。忌投资、跳槽、借贷。',
  },
];

const top3 = zodiacs.slice(0, 3);

const faqItems = [
  {
    question: '2026年哪个生肖财运最好？',
    answer:
      '2026丙午年，生肖羊（午未六合）和生肖虎（寅午戌三合火局）财运最为突出。羊与马形成最和谐的六合关系，财星活跃；虎得三合火局之力，偏财运极佳。其次是蛇、兔、狗，都因与午火形成相生或相合关系而财运亨通。',
  },
  {
    question: '2026年鼠年生肖财运如何？',
    answer:
      '2026年子午相冲，生肖鼠是冲太岁的生肖，财运受压制最为明显。建议全年保守理财，避免大额投资和借贷，增加储蓄比例。可佩戴马形饰物或红色物品化解冲煞，等待2027年丁未年财运回升。',
  },
  {
    question: '生肖运势和个人八字有什么关系？',
    answer:
      '生肖运势是基于出生年份地支的宏观参考，覆盖面广但不够精准。真正决定个人2026年运势的是完整八字（年月日时）的综合作用，特别是日主与流年丙午的关系。建议先看生肖大方向，再结合个人八字做精准分析。',
  },
  {
    question: '本命年（生肖马）2026年财运到底怎么样？',
    answer:
      '本命年的马年生肖马面临"午午自刑伏吟"，能量过旺反而带来波动。收入水平不会下降，但月度起伏较大。建议稳定现有工作和收入来源，不宜大举扩张或做高风险投资，可佩戴红色饰物化煞。',
  },
];

const faqJsonLd = faqItems.map((it) => ({ question: it.question, answer: it.answer }));

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '2026年财运最旺的生肖排行（丙午马年）',
  description:
    '2026丙午马年12生肖财运排行与命理深度解析，结合五行相生相克给出实用开运建议。',
  author: { '@type': 'Organization', name: 'CyberFate' },
  publisher: { '@type': 'Organization', name: 'CyberFate', url: 'https://www.cyberfate.me' },
  datePublished: '2026-01-01',
  dateModified: '2026-06-10',
  inLanguage: 'zh-CN',
  mainEntityOfPage: 'https://www.cyberfate.me/2026/caiyun',
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '2026年财运最旺的生肖排行',
  description: '2026丙午马年12生肖财运排行与分析，从命理角度解读各生肖财运走势。',
  url: 'https://www.cyberfate.me/2026/caiyun',
};

export default function Page() {
  return (
    <div className="min-h-dvh bg-brand-bg text-brand-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <FaqJsonLd items={faqJsonLd} />

      {/* Hero */}
      <RankingHero
        title="2026年财运最旺的生肖排行"
        desc="丙午马年，午火当令。从五行相生相克与地支刑冲合害的角度，解析12生肖在2026年的财运强弱，给出针对每个生肖的实用开运建议。"
      />

      {/* TOP 3 Cards */}
      <section className="pb-12">
        <Container>
          <SectionHead eyebrow="TOP 3 · 财运三甲" title="2026 财运最旺三大生肖" />
          <Top3Cards items={top3} />
        </Container>
      </section>

      {/* 12 zodiac table */}
      <section className="pb-16">
        <Container>
          <SectionHead eyebrow="RANKING · 完整排行" title="12生肖 2026 财运概览" />
          <RankingTable items={zodiacs} />
        </Container>
      </section>

      {/* 命理深度分析（#F6F4F1 色带区块，打破整页单色） */}
      <section className="bg-[#F6F4F1] py-14 md:py-16 mb-12">
        <PageShell>
          <div className="space-y-10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl text-brand-ink mb-4">
                2026 年为什么是这些生肖财运旺？
              </h2>
              <div className="space-y-4 text-[14px] text-[#1C1A16]/70 leading-relaxed">
                <p>
                  2026 年的天干为"丙"，地支为"午"，组合为"丙午"。丙为太阳之火，午为正午之火，
                  天干地支同属火行，构成"火气当令"的强势格局。这一年的财运分布，本质上取决于每个生肖的本命地支与
                  "午"火之间的关系——是相生、相合、相冲、相害，还是相刑。
                </p>
                <p>
                  在十二地支中，"午"与"未"形成<span className="font-medium text-[#B45309]">六合</span>
                  ，与"寅、戌"形成<span className="font-medium text-[#B45309]">三合火局</span>
                  ，与"巳"同为火气，与"卯"形成"卯木生午火"的相生关系，与"戌"还有半合关系。这五种关系都是有利的财运配置。
                </p>
                <p>
                  反之，"午"与"子"<span className="font-medium text-[#B45309]">相冲</span>
                  ，与"亥"形成"<span className="font-medium text-[#B45309]">亥午害</span>"，与"申、酉"金被火克。
                  这些不利配置的生肖，在2026年需要更加谨慎，做好风险防御。
                </p>
                <p>
                  而生肖马自身遇到马年，构成"<span className="font-medium text-[#B45309]">午午自刑伏吟</span>"，
                  能量过载反而带来波动，是典型的"本命年"现象。需要通过红色饰物、太岁符等方式调节。
                </p>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl sm:text-3xl text-brand-ink mb-4">
                各生肖财运详解
              </h2>
              <ZodiacDetailList items={zodiacs} />
            </div>
          </div>
        </PageShell>
      </section>

      {/* 相关页面 */}
      <section className="pb-12">
        <PageShell>
          <RelatedRankings
            links={[
              { href: '/2026/shiyeyun', title: '事业运排行 →', desc: '2026 哪些生肖事业上升最快' },
              { href: '/2026/aiqingyun', title: '爱情运排行 →', desc: '2026 桃花最旺的生肖' },
              { href: '/2026', title: '2026 总览 →', desc: '完整的丙午马年运势导航' },
            ]}
          />
        </PageShell>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <PageShell>
          <BaziCtaCard
            title="想要更精准的2026年个人运势？"
            desc="生肖只是地支之一。完整的八字（年月日时）才能精准定位你2026年的财、官、印、食的具体走势。"
          />
        </PageShell>
      </section>

      {/* FAQ */}
      <section className="pb-20">
        <PageShell>
          <FaqSection items={faqItems} />
        </PageShell>
      </section>

      <Footer />
    </div>
  );
}
