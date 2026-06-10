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
      </section>
    </>
  )
}
