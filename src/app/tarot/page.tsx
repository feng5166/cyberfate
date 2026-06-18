import type { Metadata } from 'next'
import PageClient from './PageClient'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'

export const metadata: Metadata = {
  title: '塔罗牌占卜 | 赛博命理师 CyberFate — AI 解读塔罗',
  description: '在线免费塔罗牌占卜，支持单张抽牌、三牌阵、凯尔特十字等多种牌阵。AI 深度解读正逆位含义，结合问题场景给出感情、事业、财运方向指引。',
  keywords: ['塔罗牌', '塔罗占卜', '免费塔罗', 'AI塔罗', '塔罗抽牌', '凯尔特十字', '塔罗三牌阵', '塔罗牌解读', '感情塔罗', '塔罗测算'],
  alternates: { canonical: 'https://www.cyberfate.me/tarot' },
  openGraph: { title: '塔罗牌占卜 | 赛博命理师 CyberFate', description: '在线免费塔罗牌占卜，AI 深度解读正逆位含义，感情事业财运。', type: 'website', url: 'https://www.cyberfate.me/tarot' },
  twitter: {
    card: 'summary',
    title: '塔罗牌占卜 | CyberFate',
    description: '在线免费塔罗牌占卜，支持单张抽牌、三牌阵、凯尔特十字等多种牌阵。AI 深度解读正逆位含义。',
  },
}

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '塔罗牌占卜 - CyberFate',
  url: 'https://www.cyberfate.me/tarot',
  description: '在线免费塔罗牌占卜，支持单张抽牌、三牌阵、凯尔特十字等多种牌阵，AI 深度解读正逆位含义。',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
  inLanguage: 'zh-CN',
  publisher: { '@type': 'Organization', name: 'CyberFate', url: 'https://www.cyberfate.me' },
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

const SYSTEM_FEATURES = [
  { icon: '✶', title: 'AI 精准解读', desc: '人工智能分析塔罗牌象征意义,提供精准个性化的解读,激发您的直觉洞察力' },
  { icon: '⚡', title: '即时占卜反馈', desc: '无需等待,AI 系统即时生成专业塔罗牌解读,随时随地获取命运指引' },
  { icon: '☆', title: '专业塔罗智慧', desc: '基于传统塔罗牌理论,结合 AI 分析能力,为您的人生关键决策提供深刻洞见' },
]

const USE_CASES = [
  { title: '感情关系解析', desc: 'AI 塔罗牌占卜能帮助您理解当前感情状况和潜在发展方向,洞察伴侣想法和关系中的隐藏问题,为您的情感决策提供指引。' },
  { title: '事业发展预测', desc: '通过 AI 塔罗牌占卜分析当前职业环境和未来机遇,识别潜在障碍和有利因素,帮助您在职业道路上做出明智选择。' },
  { title: '重大决策指导', desc: '面临人生十字路口时,AI 塔罗牌占卜可以为您提供多角度思考,展示不同选择可能带来的结果,帮助您权衡利弊。' },
  { title: '自我成长探索', desc: 'AI 塔罗牌占卜能揭示您内心深处的真实想法,帮助您认识自己的潜能和盲点,指引个人成长和自我实现的方向。' },
]

const TAROT_FAQ = [
  { q: 'AI 塔罗牌占卜与传统塔罗牌有何不同？', a: 'AI 塔罗牌占卜结合了传统塔罗牌的象征体系和人工智能的分析能力，提供更客观、全面的解读。AI 能快速处理大量信息、找出牌阵中的关联和模式，同时保持塔罗牌的神秘性和直觉性。' },
  { q: '如何提出有效的塔罗牌问题？', a: '提出明确、具体但开放性的问题能获得更有价値的 AI 塔罗牌解读。避免简单的是非问题，更好的问法是"我如何能……"、"什么因素影响……"或"我需要了解什么关于……"这类引导深入思考的问题。' },
  { q: 'AI 塔罗牌占卜的准确性如何？', a: 'AI 塔罗牌占卜是一种引导性工具，其价値在于提供新的思考角度和个人反思的机会。我们的系统基于深度学习训练，能提供有深度的见解，但最终决策权和判断力仍在您手中。' },
]

function TarotSeoSections() {
  return (
    <>
      <section className="mx-auto mt-12 max-w-[840px] animate-fadeIn">
        <div className="text-center mb-10">
          <h2 className="font-display text-[28px] tracking-[0.06em] text-[#1C1A16]">AI 塔罗牌解析系统</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#6B7280]">
            CyberFate AI 塔罗牌占卜系统结合了传统塔罗牌智慧与尖端人工智能技术,通过78张牌的图像符号和 AI 精准分析来揭示人生的真相和智慧。我们的 AI 塔罗牌解读不仅融合了传统塔罗牌占卜技巧,还结合现代心理学理论,为您提供深入且实用的人生指引。
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-4">
          {SYSTEM_FEATURES.map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center rounded-2xl border border-[#E5E0D8] bg-white p-8">
              <div className="w-14 h-14 rounded-full bg-[#F5F2ED] flex items-center justify-center text-2xl mb-5 flex-shrink-0">{item.icon}</div>
              <h3 className="text-base font-semibold text-[#1C1A16] mb-3">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[#6B7280]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-[840px] animate-fadeIn">
        <div className="text-center mb-10">
          <h2 className="font-display text-[28px] tracking-[0.06em] text-[#1C1A16]">AI 塔罗牌占卜应用场景</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {USE_CASES.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#E5E0D8] bg-white p-8">
              <h3 className="text-base font-semibold text-[#1C1A16] mb-3">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[#6B7280]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-[840px] animate-fadeIn">
        <h2 className="font-display text-[28px] tracking-[0.06em] text-[#1C1A16] text-center mb-10">AI 塔罗牌占卜常见问题</h2>
        <div className="space-y-4">
          {TAROT_FAQ.map((item) => (
            <div key={item.q} className="rounded-2xl border border-[#E5E0D8] bg-white p-7">
              <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[#1C1A16] mb-3">
                <span className="text-[#6B7280] text-base">&#9432;</span>
                {item.q}
              </h3>
              <p className="text-sm leading-relaxed text-[#6B7280]">{item.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-[#E5E0D8] bg-white/60 p-4 text-center text-xs text-[#9CA3AF]">
          ⚠️ 免责声明:本站塔罗占卜内容仅供娱乐与自我探索参考,不构成医疗、法律或投资建议。请结合现实信息理性判断。
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-[840px] animate-fadeIn">
        <div className="rounded-2xl bg-[#FAF9F6] border border-[#E5E0D8] p-10 text-center md:p-16">
          <h2 className="font-display text-[32px] tracking-[0.06em] text-[#1C1A16] leading-tight">
            开启你的<br />AI 塔罗占卜之旅
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#6B7280]">
            赛博命理师的 AI 塔罗系统融合了传统塔罗智慧与现代 AI 技术,为你提供更准确、更有深度的解读。无论你是塔罗新手还是资深爱好者,都能从中获得启发。
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#main-content"
              className="rounded-xl bg-[#1C1A16] px-10 py-3.5 text-sm font-medium text-white transition-all hover:bg-[#2D2B26]"
            >
              开始 AI 塔罗占卜 →
            </a>
            <a
              href="/bazi"
              className="rounded-xl border border-[#E5E0D8] bg-white px-10 py-3.5 text-sm font-medium text-[#1C1A16] transition-all hover:bg-[#F5F2ED]"
            >
              八字分析 →
            </a>
          </div>
          <p className="mt-4 text-xs text-[#9CA3AF]">免费体验,无需注册</p>
        </div>
      </section>
    </>
  )
}

export default function TarotPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <FaqJsonLd items={FAQ_ITEMS} />
      <PageClient seoContent={<TarotSeoSections />} />
      <section aria-label="关于塔罗占卜" className="mx-auto max-w-3xl px-4 py-12 text-[#1C1A16]/60 text-sm leading-relaxed border-t border-[#1C1A16]/8 mt-8">
        <h2 className="text-base font-semibold text-[#1C1A16] mb-4">关于塔罗占卜</h2>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">塔罗牌的起源与演变</h3>
        <p className="mb-3">塔罗牌的现代雏形可追溯至 15 世纪意大利北部宫廷，最初作为贵族娱乐的纸牌游戏（Tarocchi）流传。当时的牌组虽已具备大阿尔卡纳的雏形，但尚未与神秘学产生关联，仅作为社交场合的智力消遣。</p>
        <p className="mb-3">18 世纪法国神秘学家库尔·德·热伯林首次将塔罗与古埃及智慧、卡巴拉传统挂钩，赋予其神秘学意涵。19 世纪末英国黄金黎明协会系统化塔罗体系，韦特与帕梅拉·史密斯于 1909 年推出"韦特塔罗"，奠定了今日全球最普及的塔罗版本。</p>
        <p className="mb-3">20 世纪荣格分析心理学的兴起，使塔罗牌被重新诠释为承载人类共同潜意识的"原型符号"载体。塔罗由此从神秘占卜工具转型为现代心理探索与自我对话的媒介，逐步进入主流文化视野。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">78 张牌的完整体系</h3>
        <p className="mb-3">完整塔罗牌共 78 张，由 22 张大阿尔卡纳与 56 张小阿尔卡纳组成。大阿尔卡纳从 0 号愚者到 21 号世界，描绘灵魂从天真出发、历经各种考验、最终回归圆满的完整成长旅程，处理人生重大主题与转折点。</p>
        <p className="mb-3">小阿尔卡纳分为权杖（火，对应行动与热情）、圣杯（水，对应情感与关系）、宝剑（风，对应思维与冲突）、金币（土，对应物质与现实）四个花色，每个花色各 14 张，包含 1–10 数字牌与侍从、骑士、王后、国王四张宫廷牌。</p>
        <p className="mb-3">每张牌均有正位与逆位两种状态，逆位并非简单的"凶兆"，而是牌意的削弱、阻塞、内化或反向呈现。例如正位的"力量"代表勇气与温柔的掌控，逆位则可能暗示自我怀疑或情绪失控，使解读层次更加细腻立体。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">常见牌阵解析</h3>
        <p className="mb-3">单张抽牌是最简洁的牌阵，适合每日一问、是非判断或快速洞察当下状态。它要求提问者高度聚焦于一个具体问题，让一张牌承载完整的解读信息，是塔罗入门最常用的练习方式。</p>
        <p className="mb-3">三牌阵是经典的多牌组合，常见结构包括"过去-现在-未来"、"现状-障碍-建议"、"选项A-选项B-中立视角"等。它适合具体决策与短期趋势判断，结构简明又能呈现完整脉络，是日常占卜的主力牌阵。</p>
        <p className="mb-3">凯尔特十字（10 张）是最完整的传统牌阵，涵盖现状、障碍、根源、过去、未来、内心、外部环境、希望与恐惧、最终结果等十个位置。关系牌阵（5 张）则专门针对感情或合作议题，分析双方立场与互动模式。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">如何提出好的塔罗问题</h3>
        <p className="mb-3">开放式问题优于封闭式问题。"这段关系的走向如何"远比"他爱我吗"更有价值，前者邀请塔罗给出多维度信息，后者则将复杂情境压缩为是非判断，浪费了塔罗的解读潜力与象征厚度。</p>
        <p className="mb-3">聚焦当下优于执着远期结果。"我现在需要关注什么"或"这件事的关键挑战是什么"，比"我们三年后会不会结婚"更能获得可行动的指引。塔罗擅长照见当下脉络，而非预测固定不变的未来。</p>
        <p className="mb-3">一次只问一个问题。试图一次抽牌解决所有困惑，焦点分散会导致牌意混乱、解读失焦。明确单一议题并配合恰当牌阵，是获得清晰指引的前提条件，也体现对塔罗工具的基本尊重。</p>

        <h3 className="text-sm font-semibold text-[#1C1A16] mt-6 mb-3">CyberFate AI 塔罗的特点</h3>
        <p className="mb-3">平台支持中文问题直接输入，无需手动翻译成英文。AI 在解读时会自动识别中文问题中的情感语境与文化背景，避免传统英文塔罗工具对中文用户的语义损失与文化错位。</p>
        <p className="mb-3">AI 解读并非静态词条堆砌，而是结合牌阵位置的语境、正逆位的细微差别、问题的具体场景，给出贴合个体处境的叙事性分析。每一次解读都是针对当前问题的定制化生成，避免千篇一律的模板感。</p>
        <p className="mb-3">升级会员可解锁凯尔特十字（10 张）完整牌阵与关系牌阵（5 张），覆盖更深层的情境分析与关系动态。免费版的单张抽牌与三牌阵已能满足大部分日常占卜与决策辅助需求，门槛友好。</p>

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
              { name: '六爻占卜', href: '/liuyao' },
              { name: '梅花易数', href: '/meihua' },
              { name: '八字分析', href: '/bazi' },
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
