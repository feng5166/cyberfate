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
  title: '2026年爱情运最旺的生肖排行 | CyberFate — 丙午马年桃花运势',
  description:
    '2026丙午马年，哪些生肖桃花最旺、爱情运最好？从命理角度解析12生肖2026年感情运排行，结合桃花星与刑冲合害给出脱单/感情建议。',
  keywords: [
    '2026年爱情运',
    '2026生肖桃花运',
    '丙午年桃花',
    '马年爱情运',
    '2026脱单生肖',
    '生肖爱情运排行',
    '2026桃花最旺',
    '感情运势',
    '本命年感情',
  ],
  alternates: { canonical: 'https://www.cyberfate.me/2026/aiqingyun' },
  openGraph: {
    title: '2026年爱情运最旺的生肖排行 | CyberFate',
    description:
      '2026丙午马年12生肖爱情运排行，从桃花星与地支关系给出脱单与感情建议。',
    type: 'article',
    url: 'https://www.cyberfate.me/2026/aiqingyun',
  },
  twitter: {
    card: 'summary',
    title: '2026年爱情运最旺的生肖排行 | CyberFate',
    description: '2026丙午马年爱情运排行：羊、兔、蛇、马、虎桃花旺。',
  },
};

const zodiacs: ZodiacFortune[] = [
  {
    name: '生肖羊',
    emoji: '🐏',
    rank: 1,
    stars: 5,
    reason: '午未六合，主桃花',
    detail:
      '午未六合是十二地支中最和谐的合局之一，对感情的助力极大。生肖羊在2026年是名副其实的"桃花最旺"生肖，单身者容易遇到契合的对象，已婚者感情甜蜜温暖。羊的温润性格在丙午年的火气中得到更柔和的展现，特别有吸引力。',
    advice: '宜主动社交、参加聚会、积极相亲。忌错过良缘。',
  },
  {
    name: '生肖兔',
    emoji: '🐰',
    rank: 2,
    stars: 5,
    reason: '卯木桃花星',
    detail:
      '卯为正桃花星，生肖兔本就是十二生肖中桃花气场最浓的之一。2026年丙午年火气当令，木火通明的格局让生肖兔的魅力大放异彩。无论是外表、谈吐、气质都更具吸引力。是脱单率最高的生肖之一，也是已婚者感情升温的好年份。',
    advice: '宜大胆表白、推进关系、走向下一阶段。忌犹豫不决。',
  },
  {
    name: '生肖蛇',
    emoji: '🐍',
    rank: 3,
    stars: 4,
    reason: '巳午同气，魅力倍增',
    detail:
      '巳火与午火同气连枝，生肖蛇在2026年的个人魅力得到放大。聪明、神秘、有深度的特质让蛇在感情市场上特别有吸引力。但蛇的感情态度通常比较理性，需要时间发酵。今年遇到的关系，更可能是质量型而非数量型。',
    advice: '宜深度交流、慢慢培养、不急于定义。忌玩暧昧。',
  },
  {
    name: '生肖马',
    emoji: '🐴',
    rank: 4,
    stars: 4,
    reason: '本命年感情活跃',
    detail:
      '本命年的能量激活让生肖马在2026年的感情生活非常活跃。单身者机会多，已婚者感情有起伏。本命年的特点是"动"，所以感情上也容易出现转折——可能是关系升级、可能是分手重来、可能是异地变同城。重要的是保持清醒。',
    advice: '宜把握机会、做出选择、佩戴红色饰物。忌优柔寡断。',
  },
  {
    name: '生肖虎',
    emoji: '🐯',
    rank: 5,
    stars: 3,
    reason: '寅午半合火，吸引力强',
    detail:
      '寅午半合的格局让生肖虎在2026年个人魅力提升。事业旺、气场强、自信足的特点让虎在感情上很有吸引力。但虎的感情态度容易"事业优先"，今年事业机会多反而可能错过感情。需要刻意分配时间给感情。',
    advice: '宜分配时间、主动沟通、平衡事业感情。忌冷落对方。',
  },
  {
    name: '生肖龙',
    emoji: '🐲',
    rank: 6,
    stars: 3,
    reason: '辰土稳重，平稳发展',
    detail:
      '生肖龙在2026年感情运表现平稳，没有大起大落。单身者机会一般，需要主动出击；已婚者感情稳定，可以考虑推进重要节点（结婚、生子、搬家等）。整体是"按部就班"的感情节奏。',
    advice: '宜推进重要节点、做长期规划。忌等待天上掉缘分。',
  },
  {
    name: '生肖狗',
    emoji: '🐶',
    rank: 7,
    stars: 3,
    reason: '午戌半合，缘分降临',
    detail:
      '午戌半合的格局让生肖狗在2026年有缘分降临的机会。可能是朋友介绍、可能是工作认识、可能是兴趣社群相遇。狗的忠诚特质在丙午年得到欣赏，容易被"看见真心"。建议多参加活动，扩大社交圈。',
    advice: '宜参加活动、扩大社交圈、接受介绍。忌封闭自我。',
  },
  {
    name: '生肖牛',
    emoji: '🐮',
    rank: 8,
    stars: 2,
    reason: '丑土稳重，缘分平淡',
    detail:
      '生肖牛在2026年感情运表现平淡。牛的稳重性格在火旺的年份不够"显眼"，单身者主动出击的难度较大。建议通过共同兴趣、长期共事等方式慢慢培养感情。已婚者感情稳定，专注经营即可。',
    advice: '宜慢慢培养、专注经营。忌期待激情。',
  },
  {
    name: '生肖猴',
    emoji: '🐵',
    rank: 9,
    stars: 2,
    reason: '申金被火克，感情起伏',
    detail:
      '午火克申金，生肖猴在2026年感情运起伏较大。容易因为情绪冲动、沟通不畅而出现矛盾。建议放慢节奏，多倾听少争辩。单身者今年遇到的对象需要更长时间观察，不要急于定下来。',
    advice: '宜放慢节奏、控制情绪、多倾听。忌冲动表白、激烈争吵。',
  },
  {
    name: '生肖鸡',
    emoji: '🐔',
    rank: 10,
    stars: 2,
    reason: '酉金火克，桃花有压',
    detail:
      '酉金被午火克制，生肖鸡在2026年桃花运受压。单身者容易陷入"剃头挑子一头热"的局面，已婚者容易在小事上起冲突。建议用更柔软的态度对待感情，不要过于强势或过于敏感。',
    advice: '宜柔软姿态、放低期待、多包容。忌过于强势、过于敏感。',
  },
  {
    name: '生肖猪',
    emoji: '🐷',
    rank: 11,
    stars: 2,
    reason: '亥午相害，感情有损',
    detail:
      '亥午相害的格局让生肖猪在2026年感情运容易有损耗。容易遇到"看错人"、"信错人"的情况。建议在重要的感情决策上保持理性，不要被一时的甜言蜜语冲昏头脑。已婚者注意防范第三者干扰。',
    advice: '宜保持理性、慢慢观察、防范干扰。忌冲动结婚、轻信承诺。',
  },
  {
    name: '生肖鼠',
    emoji: '🐭',
    rank: 12,
    stars: 1,
    reason: '子午冲，感情动荡',
    detail:
      '生肖鼠是2026年的冲太岁生肖，感情上容易出现大的动荡：分手、矛盾爆发、长期关系破裂等。建议全年以"稳"为主，不做重大感情决策（求婚、结婚、离婚等）。已有的关系多倾听对方诉求，化解矛盾。',
    advice: '宜稳定关系、化解矛盾、佩戴马形饰物化煞。忌做重大决定。',
  },
];

const top3 = zodiacs.slice(0, 3);

const faqItems = [
  {
    question: '2026年哪个生肖桃花运最旺？',
    answer:
      '2026丙午年，生肖羊（午未六合主桃花）和生肖兔（卯木为正桃花星）桃花运最为突出。羊与马形成最和谐的六合关系，感情甜蜜温暖；兔本身就是十二生肖中桃花气场最浓的之一，木火通明让魅力大放异彩。其次是蛇、马、虎。',
  },
  {
    question: '本命年（生肖马）2026年感情会怎样？',
    answer:
      '本命年的能量激活让生肖马在2026年感情生活非常活跃，机会多但也容易有起伏。可能出现关系升级、分手重来、异地变同城等转折。建议保持清醒，不优柔寡断，做该做的选择。佩戴红色饰物可化解伏吟之煞。',
  },
  {
    question: '2026年鼠年生肖感情运如何？',
    answer:
      '2026年子午相冲，生肖鼠在感情上容易出现大的动荡，如分手、矛盾爆发、长期关系破裂等。建议全年以"稳"为主，不做重大感情决策（求婚、结婚、离婚等），多倾听对方诉求化解矛盾。可佩戴马形饰物化煞。',
  },
  {
    question: '2026年适合结婚的生肖有哪些？',
    answer:
      '从生肖角度看，2026年最适合结婚的是生肖羊（午未六合）、生肖兔（桃花正旺）、生肖蛇（同气相求）、生肖马（本命年但站在舞台中央）、生肖龙（适合推进重要节点）。但具体的结婚吉日还需要结合双方完整八字和具体的择日方法。',
  },
];

const faqJsonLd = faqItems.map((it) => ({ question: it.question, answer: it.answer }));

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '2026年爱情运最旺的生肖排行（丙午马年）',
  description:
    '2026丙午马年12生肖爱情运排行与桃花深度解析，结合桃花星与刑冲合害给出脱单与感情建议。',
  author: { '@type': 'Organization', name: 'CyberFate' },
  publisher: { '@type': 'Organization', name: 'CyberFate', url: 'https://www.cyberfate.me' },
  datePublished: '2026-01-01',
  dateModified: '2026-06-10',
  inLanguage: 'zh-CN',
  mainEntityOfPage: 'https://www.cyberfate.me/2026/aiqingyun',
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '2026年爱情运最旺的生肖排行',
  description: '2026丙午马年12生肖爱情运排行，桃花运与婚恋运势命理解读。',
  url: 'https://www.cyberfate.me/2026/aiqingyun',
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

      <RankingHero
        title="2026年爱情运最旺的生肖排行"
        desc="丙午马年，桃花星活跃。从十二地支的桃花关系与流年六合三合出发，看看哪些生肖在2026年爱情运最旺，哪些生肖需要更用心经营。"
      />

      <section className="pb-12">
        <Container>
          <SectionHead eyebrow="TOP 3 · 桃花三甲" title="2026 爱情运最旺三大生肖" />
          <Top3Cards items={top3} />
        </Container>
      </section>

      <section className="pb-16">
        <Container>
          <SectionHead eyebrow="RANKING · 完整排行" title="12生肖 2026 爱情运概览" />
          <RankingTable items={zodiacs} />
        </Container>
      </section>

      {/* 命理深度分析（#F6F4F1 色带区块，打破整页单色） */}
      <section className="bg-[#F6F4F1] py-14 md:py-16 mb-12">
        <PageShell>
          <div className="space-y-10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl text-brand-ink mb-4">
                2026 年桃花运为什么这样分布？
              </h2>
              <div className="space-y-4 text-[14px] text-[#1C1A16]/70 leading-relaxed">
                <p>
                  在传统命理学中，桃花运的强弱主要看四个方面：本命的桃花星、流年与本命的合冲关系、八字中夫妻宫的状态、
                  以及流年红鸾天喜星的位置。生肖运势主要看前两个维度。
                </p>
                <p>
                  十二地支中，<span className="font-medium text-[#B45309]">子午卯酉</span>是四大正桃花。
                  其中"卯"对应生肖兔，本就是桃花气场最浓的生肖之一。2026年丙午年是火气当令，木生火的卯午相生关系让兔的桃花更上一层楼。
                </p>
                <p>
                  地支六合中，<span className="font-medium text-[#B45309]">午未六合</span>
                  是和谐度最高的合局之一，所以生肖羊在2026年的桃花运表现最为突出。
                  巳午同气、寅午半合、午戌半合，分别让蛇、虎、狗的感情运得到不同程度的助力。
                </p>
                <p>
                  而生肖鼠（子午冲）、猪（亥午害）、猴（申金被克）、鸡（酉金被克）则是2026年感情上需要更加用心的生肖。
                  尤其是生肖鼠，作为冲太岁的生肖，需要全年以"稳"字当头。
                </p>
                <p>
                  生肖马的本命年，则是机遇与转折并存的特殊一年——感情上容易"动"，无论是好是坏，都会有变化。
                </p>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl sm:text-3xl text-brand-ink mb-4">
                各生肖爱情运详解
              </h2>
              <ZodiacDetailList items={zodiacs} />
            </div>
          </div>
        </PageShell>
      </section>

      <section className="pb-12">
        <PageShell>
          <RelatedRankings
            links={[
              { href: '/2026/caiyun', title: '财运排行 →', desc: '2026 哪些生肖财运最旺' },
              { href: '/2026/shiyeyun', title: '事业运排行 →', desc: '2026 哪些生肖事业上升最快' },
              { href: '/2026', title: '2026 总览 →', desc: '完整的丙午马年运势导航' },
            ]}
          />
        </PageShell>
      </section>

      <section className="pb-20">
        <PageShell>
          <BaziCtaCard
            title="想看清2026年具体桃花期与正缘方向？"
            desc="生肖只是宏观参考。完整八字才能定位夫妻宫的具体状态、桃花星的精确位置，看清2026年最佳的感情节点。"
          />
        </PageShell>
      </section>

      <section className="pb-20">
        <PageShell>
          <FaqSection items={faqItems} />
        </PageShell>
      </section>

      <Footer />
    </div>
  );
}
