import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout/Footer';
import { FaqJsonLd } from '@/components/seo/FaqJsonLd';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: '2026年事业运最旺的生肖排行 | CyberFate — 丙午马年职场运势',
  description:
    '2026丙午马年，哪些生肖事业上升最快？从命理角度解析12生肖2026年事业运强弱排行，给出晋升、跳槽、创业的实用建议。',
  keywords: [
    '2026年事业运',
    '2026生肖事业运',
    '丙午年事业运',
    '马年事业运',
    '2026事业最旺生肖',
    '生肖事业运排行',
    '2026职场运势',
    '事业晋升',
    '本命年事业',
  ],
  alternates: { canonical: 'https://www.cyberfate.me/2026/shiyeyun' },
  openGraph: {
    title: '2026年事业运最旺的生肖排行 | CyberFate',
    description:
      '2026丙午马年，从命理角度解析12生肖事业运强弱排行，给出晋升、跳槽、创业的实用建议。',
    type: 'article',
    url: 'https://www.cyberfate.me/2026/shiyeyun',
  },
  twitter: {
    card: 'summary',
    title: '2026年事业运最旺的生肖排行 | CyberFate',
    description: '2026丙午马年事业运排行：虎、马、蛇、羊、龙稳居前列。',
  },
};

interface ZodiacFortune {
  name: string;
  emoji: string;
  rank: number;
  stars: number;
  reason: string;
  detail: string;
  advice: string;
}

const zodiacs: ZodiacFortune[] = [
  {
    name: '生肖虎',
    emoji: '🐯',
    rank: 1,
    stars: 5,
    reason: '寅午戌三合火局，事业贵人齐聚',
    detail:
      '寅午戌三合火局成立，生肖虎在2026年事业运势达到峰值。三合的格局意味着多方合力，贵人、平台、机会同时到位。无论是晋升、跳槽、还是创业，都有强劲的助力。是2026年最适合"主动出击"的生肖。',
    advice: '宜主动争取晋升、果断跳槽、推进创业。忌瞻前顾后。',
  },
  {
    name: '生肖马',
    emoji: '🐴',
    rank: 2,
    stars: 5,
    reason: '本命年冲动力，舞台中央',
    detail:
      '虽然本命年带来波动，但生肖马在2026年事业上反而站到了舞台中央。能量激活、关注度高、机会涌现。本命年的特点是"事多、责任大、转折点多"，是事业转型、平台跃迁的关键年。但风险与机遇并存，需要稳准狠。',
    advice: '宜把握平台机会、主动转型、佩戴红色饰物。忌急躁冒进。',
  },
  {
    name: '生肖蛇',
    emoji: '🐍',
    rank: 3,
    stars: 4,
    reason: '巳午同气，专业能力大放异彩',
    detail:
      '巳火与午火同气连枝，生肖蛇在2026年专业能力得到充分展现。聪慧、洞察力、决策力都处于高位，特别适合需要专业判断的工作。是技术、医疗、咨询、法律、研究等专业领域属蛇人士的高光之年。',
    advice: '宜深耕专业、独当一面、对外发声。忌沦为执行工具。',
  },
  {
    name: '生肖羊',
    emoji: '🐏',
    rank: 4,
    stars: 4,
    reason: '午未六合，团队合作出成绩',
    detail:
      '午未六合的格局让生肖羊在2026年事业上获得"和谐共赢"的局面。特别擅长团队协作、跨部门沟通、关系经营。如果工作性质需要协调多方，今年是大放异彩的好时机。容易因为"人和"而获得意外的事业回报。',
    advice: '宜加强团队合作、跨部门协作、维护关系网。忌单打独斗。',
  },
  {
    name: '生肖龙',
    emoji: '🐲',
    rank: 5,
    stars: 3,
    reason: '辰土稳重，火生土厚积薄发',
    detail:
      '火生土的格局让生肖龙在2026年事业上呈现"厚积薄发"的态势。不会有特别耀眼的爆发，但每一步都扎实稳健。适合做长期规划、积累资源、培养能力。今年的努力会在2027丁未年迎来回报。',
    advice: '宜做长期规划、积累资源、深化专业。忌追求短期出彩。',
  },
  {
    name: '生肖兔',
    emoji: '🐰',
    rank: 6,
    stars: 3,
    reason: '卯午相生，创意释放',
    detail:
      '卯木生午火，生肖兔的创意才华在2026年得到充分释放。文创、设计、内容、营销等创意类工作的属兔人士今年表现突出。但需要注意，木生火过旺也意味着精力消耗大，要注意劳逸结合。',
    advice: '宜释放创意、发表作品、开拓内容方向。忌过度透支精力。',
  },
  {
    name: '生肖狗',
    emoji: '🐶',
    rank: 7,
    stars: 3,
    reason: '午戌半合火，贵人提携',
    detail:
      '午戌半合的格局让生肖狗在2026年事业上得到贵人提携。可能是上司、可能是客户、可能是行业前辈，会有人在关键时刻为你打开门。但需要主动经营关系，被动等待不会有结果。',
    advice: '宜主动求教、维护贵人关系、参加行业活动。忌闭门造车。',
  },
  {
    name: '生肖牛',
    emoji: '🐮',
    rank: 8,
    stars: 2,
    reason: '丑土稳重，事业平稳',
    detail:
      '生肖牛在2026年事业运表现平稳，没有大起大落。是"按部就班"型的一年，工作进展正常，但也很难有突破性的表现。建议沉淀专业、夯实基础、为来年布局。本年度不适合大动作。',
    advice: '宜沉淀专业、夯实基础、稳中求进。忌频繁跳槽、激进转型。',
  },
  {
    name: '生肖猴',
    emoji: '🐵',
    rank: 9,
    stars: 2,
    reason: '申金被火克，事业受压',
    detail:
      '午火克申金，生肖猴在2026年事业运受压。原本灵活机变的优势难以发挥，容易遇到来自上司或同事的压力。建议低调过渡，不要在职场上锋芒太露。重要决策推迟到2027年再做。',
    advice: '宜低调隐忍、专注本职、避免冲突。忌锋芒太露。',
  },
  {
    name: '生肖鸡',
    emoji: '🐔',
    rank: 10,
    stars: 2,
    reason: '酉金火克，发挥受限',
    detail:
      '与生肖猴类似，酉金被午火克制，生肖鸡2026年事业运表现一般。容易遇到瓶颈、遭遇否定、感到怀才不遇。建议把心态放平，不要急于改变现状，做好本职工作即可。',
    advice: '宜稳住心态、做好本职、暗中积累。忌冲动辞职、激烈对抗。',
  },
  {
    name: '生肖猪',
    emoji: '🐷',
    rank: 11,
    stars: 2,
    reason: '亥午相害，合作不顺',
    detail:
      '亥午相害的格局让生肖猪在2026年事业上容易遇到合作纠纷。同事关系、客户关系、合作伙伴关系都需要更加用心经营。容易因为信任错位、沟通不畅而吃亏。建议所有合作都白纸黑字，不要轻信口头承诺。',
    advice: '宜书面化合作、谨慎签约、加强沟通。忌轻信口头承诺。',
  },
  {
    name: '生肖鼠',
    emoji: '🐭',
    rank: 12,
    stars: 1,
    reason: '子午冲，事业动荡',
    detail:
      '生肖鼠是2026年的冲太岁生肖，事业上容易出现大的动荡：组织变动、岗位调整、被动离职等。建议全年以"守"为主，不主动跳槽、不轻易创业。如果遇到组织变动，把损失降到最低即可。',
    advice: '宜被动守成、化解冲煞、降低预期。忌主动跳槽、创业。',
  },
];

const top3 = zodiacs.slice(0, 3);

const faqItems = [
  {
    question: '2026年哪个生肖事业运最好？',
    answer:
      '2026丙午年，生肖虎（寅午戌三合火局）和生肖马（本命年冲动力）事业运最为突出。虎得三合之利，贵人与机会齐聚；马虽是本命年但站到舞台中央，是事业转型的关键年。其次是蛇、羊、龙、兔等。',
  },
  {
    question: '本命年（生肖马）适合跳槽或创业吗？',
    answer:
      '本命年的马年生肖马事业运势在2026年虽然站到舞台中央，但伏吟带来的波动较大。如果有充分准备和明确方向，是可以把握平台机会做转型的；但不建议盲目跳槽或冲动创业。建议佩戴红色饰物或太岁符化解伏吟之煞。',
  },
  {
    question: '2026年鼠年生肖事业运如何？',
    answer:
      '2026年子午相冲，生肖鼠是冲太岁的生肖，事业上容易出现组织变动、岗位调整、被动离职等动荡。建议全年以"守"为主，不主动跳槽、不轻易创业，等待2027年丁未年事业运回升。',
  },
  {
    question: '生肖事业运和实际职业发展有多大关系？',
    answer:
      '生肖运势是宏观层面的参考，反映的是大势和概率，但不能决定一切。真正决定职业发展的还是个人能力、行业趋势、平台选择和努力程度。建议把生肖运势作为决策时机的参考，而非决策依据本身。精准的事业运分析需要结合完整八字。',
  },
];

const faqJsonLd = faqItems.map((it) => ({ question: it.question, answer: it.answer }));

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '2026年事业运最旺的生肖排行（丙午马年）',
  description:
    '2026丙午马年12生肖事业运排行与命理深度解析，给出晋升、跳槽、创业的实用建议。',
  author: { '@type': 'Organization', name: 'CyberFate' },
  publisher: { '@type': 'Organization', name: 'CyberFate', url: 'https://www.cyberfate.me' },
  datePublished: '2026-01-01',
  dateModified: '2026-06-10',
  inLanguage: 'zh-CN',
  mainEntityOfPage: 'https://www.cyberfate.me/2026/shiyeyun',
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '2026年事业运最旺的生肖排行',
  description: '2026丙午马年12生肖事业运排行，职场发展与升职机遇命理解读。',
  url: 'https://www.cyberfate.me/2026/shiyeyun',
};

function StarRating({ count }: { count: number }) {
  return (
    <span className="text-[#C8956C] tracking-wider" aria-label={`${count}星`}>
      {'★'.repeat(count)}
      <span className="text-[#1C1A16]/15">{'★'.repeat(5 - count)}</span>
    </span>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1A16] font-serif">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <FaqJsonLd items={faqJsonLd} />

      <section className="pt-20 pb-10">
        <Container>
          <div className="max-w-[840px] mx-auto text-center">
            <p className="text-sm tracking-[0.3em] text-[#C8956C] mb-4">2026 · 丙午马年</p>
            <h1 className="font-heading text-3xl sm:text-5xl text-[#1C1A16] mb-5 leading-tight">
              2026年事业运最旺的生肖排行
            </h1>
            <p className="text-base text-[#1C1A16]/75 leading-relaxed">
              丙午马年，火气当令。从十二地支与流年太岁的关系出发，看看哪些生肖在2026年事业运势最旺，哪些生肖需要稳健过渡。
            </p>
          </div>
        </Container>
      </section>

      <section className="pb-12">
        <Container>
          <div className="text-center mb-8">
            <p className="text-sm tracking-[0.2em] text-[#1C1A16]/60">TOP 3 · 事业三甲</p>
            <h2 className="font-heading text-2xl text-[#1C1A16] mt-2">2026 事业运最旺三大生肖</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {top3.map((z) => (
              <Card
                key={z.name}
                hover={false}
                className="relative overflow-hidden border-2 border-[#C8956C]/40 bg-gradient-to-br from-[#FFF6EC] via-[#FBE8D1] to-[#F5D6B0]"
              >
                <div className="absolute top-3 right-4 text-[#C8956C]/30 font-heading text-7xl leading-none select-none">
                  {z.rank}
                </div>
                <div className="relative">
                  <div className="text-5xl mb-3">{z.emoji}</div>
                  <h3 className="font-heading text-2xl text-[#1C1A16] mb-1">{z.name}</h3>
                  <div className="mb-3 text-base">
                    <StarRating count={z.stars} />
                  </div>
                  <p className="font-heading text-base text-[#8B5A2B] mb-3">{z.reason}</p>
                  <p className="text-sm text-[#1C1A16]/75 leading-relaxed">{z.detail}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-16">
        <Container>
          <div className="text-center mb-8">
            <p className="text-sm tracking-[0.2em] text-[#1C1A16]/60">RANKING · 完整排行</p>
            <h2 className="font-heading text-2xl text-[#1C1A16] mt-2">12生肖 2026 事业运概览</h2>
          </div>
          <Card hover={false} className="bg-white/95 p-0 overflow-hidden">
            <div className="divide-y divide-[#1C1A16]/8">
              {zodiacs.map((z) => (
                <div
                  key={z.name}
                  className="grid grid-cols-12 items-center gap-4 px-5 py-4 hover:bg-[#FAF6EE] transition-colors"
                >
                  <div className="col-span-1 text-xl text-[#1C1A16]/40 font-heading">{z.rank}</div>
                  <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                    <span className="text-2xl">{z.emoji}</span>
                    <span className="font-heading text-base">{z.name}</span>
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-sm">
                    <StarRating count={z.stars} />
                  </div>
                  <div className="col-span-12 sm:col-span-7 text-sm text-[#1C1A16]/75 leading-relaxed">
                    <span className="text-[#8B5A2B] font-medium">{z.reason}</span>
                    <span className="text-[#1C1A16]/40"> — </span>
                    <span>{z.advice}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </section>

      <section className="pb-16">
        <Container>
          <div className="max-w-[840px] mx-auto space-y-10">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl text-[#1C1A16] mb-4">
                2026 年事业运为什么这样分布？
              </h2>
              <div className="space-y-4 text-[#1C1A16]/80 leading-relaxed">
                <p>
                  事业运在命理学中对应"官星"与"印星"的力量。官代表权威、地位、平台；印代表能力、学习、贵人。2026丙午年火气当令，
                  对于以火为喜用的人来说，官印之气自然旺盛；对于以火为忌的人来说，则容易遇到压力和瓶颈。
                </p>
                <p>
                  从地支关系看，<span className="text-[#8B5A2B] font-medium">寅午戌三合火局</span>
                  让生肖虎、马、狗形成强势的事业铁三角。其中虎是发起者，马是承载者，狗是收纳者。
                  生肖羊与马形成<span className="text-[#8B5A2B] font-medium">六合</span>，
                  在合作型事业中表现突出。
                </p>
                <p>
                  生肖蛇与马同属火气，属于"同气相求"，专业能力得到充分认可。生肖兔的木生午火，创意类工作大有可为。
                  生肖龙的辰土稳厚，承接火气，适合长线积累。
                </p>
                <p>
                  而生肖鼠（子午冲）、猪（亥午害）、猴（申金被火克）、鸡（酉金被火克）则需要更加谨慎，
                  在事业上以"守"代"攻"。生肖马自身的本命年伏吟，则是机遇与风险并存的特殊一年。
                </p>
              </div>
            </div>

            <div>
              <h2 className="font-heading text-2xl sm:text-3xl text-[#1C1A16] mb-4">
                各生肖事业运详解
              </h2>
              <div className="space-y-6">
                {zodiacs.map((z) => (
                  <div key={z.name} className="border-l-2 border-[#C8956C]/40 pl-5">
                    <h3 className="font-heading text-xl text-[#1C1A16] mb-2 flex items-center gap-3">
                      <span className="text-2xl">{z.emoji}</span>
                      <span>{z.name}</span>
                      <span className="text-base"><StarRating count={z.stars} /></span>
                    </h3>
                    <p className="text-sm text-[#1C1A16]/75 leading-relaxed mb-2">{z.detail}</p>
                    <p className="text-xs text-[#8B5A2B]">建议：{z.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="pb-12">
        <Container>
          <div className="max-w-[840px] mx-auto">
            <Card hover={false} className="bg-white/90">
              <h3 className="font-heading text-xl text-[#1C1A16] mb-4">查看其他维度的2026年生肖运势</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <Link
                  href="/2026/caiyun"
                  className="border border-[#1C1A16]/10 rounded-lg p-4 hover:border-[#C8956C] transition-colors"
                >
                  <div className="font-heading text-base mb-1">财运排行 →</div>
                  <div className="text-[#1C1A16]/60 text-xs">2026 哪些生肖财运最旺</div>
                </Link>
                <Link
                  href="/2026/aiqingyun"
                  className="border border-[#1C1A16]/10 rounded-lg p-4 hover:border-[#C8956C] transition-colors"
                >
                  <div className="font-heading text-base mb-1">爱情运排行 →</div>
                  <div className="text-[#1C1A16]/60 text-xs">2026 桃花最旺的生肖</div>
                </Link>
                <Link
                  href="/2026"
                  className="border border-[#1C1A16]/10 rounded-lg p-4 hover:border-[#C8956C] transition-colors"
                >
                  <div className="font-heading text-base mb-1">2026 总览 →</div>
                  <div className="text-[#1C1A16]/60 text-xs">完整的丙午马年运势导航</div>
                </Link>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <Card
            hover={false}
            className="bg-gradient-to-br from-[#1C1A16] to-[#3A2F23] text-white border-0 shadow-xl text-center max-w-[840px] mx-auto"
          >
            <h3 className="font-heading text-2xl sm:text-3xl mb-3">想知道2026年自己具体的事业突破点？</h3>
            <p className="text-sm text-white/75 mb-6 leading-relaxed">
              生肖只是宏观参考。完整八字才能看清2026年你的官星、印星具体走势，定位晋升、跳槽、创业的最佳时机。
            </p>
            <Link
              href="/bazi"
              className="inline-block bg-[#C8956C] hover:bg-[#B5825B] text-white px-8 py-3 rounded-full font-heading transition-colors"
            >
              免费做八字详细分析 →
            </Link>
          </Card>
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <div className="max-w-[840px] mx-auto">
            <h2 className="font-heading text-2xl text-[#1C1A16] mb-6 text-center">常见问题</h2>
            <div className="space-y-4">
              {faqItems.map((it) => (
                <Card key={it.question} hover={false} className="bg-white/90">
                  <h3 className="font-heading text-base text-[#1C1A16] mb-2">{it.question}</h3>
                  <p className="text-sm text-[#1C1A16]/70 leading-relaxed">{it.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
