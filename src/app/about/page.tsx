import { Sparkles, Shield, Compass, Activity } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout/Footer';

const brandHighlights = [
  {
    title: '品牌使命',
    description: '把东方智慧重新翻译到现代语境，提供可信、可讨论、可执行的命理参考，让决策基于洞察而非迷信。',
  },
  {
    title: '设计哲学',
    description: '暖白底色、精致排版与衬线字体结合科技质感，营造沉静思考的状态，突出仪式感与透明度。',
  },
  {
    title: '体验准则',
    description: '把复杂命理模型拆解为连贯叙事与实用建议，所有结论都伴随假设前提、信心区间与行动提示。',
  },
];

const coreValues = [
  {
    title: '理性共鸣',
    description: '使用可溯源的数据与模型，提示统计信心，让命理成为启发思考的语言。',
    icon: Shield,
  },
  {
    title: '东方美学',
    description: '以东方视觉语汇和人文语境讲述命理故事，保留仪式感同时杜绝神秘化。',
    icon: Sparkles,
  },
  {
    title: '行动指引',
    description: '输出多路径选择与实践建议，帮助用户把洞察转化为可执行的日常策略。',
    icon: Compass,
  },
  {
    title: '持续学习',
    description: '结合用户反馈和新资料反复校准模型，保证解释与建议保持更新与谦逊。',
    icon: Activity,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1A16]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" aria-hidden="true" style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3Ccircle cx='80' cy='80' r='75' fill='none' stroke='%231C1A16' stroke-width='0.8'/%3E%3Ccircle cx='80' cy='40' r='6' fill='%231C1A16'/%3E%3Ccircle cx='80' cy='120' r='6' fill='none' stroke='%231C1A16' stroke-width='0.8'/%3E%3C/svg%3E\")",
          backgroundSize: '200px 200px',
        }} />

        <section className="pt-24 pb-16 relative">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-sm tracking-[0.3em] text-[#1C1A16]/60 mb-4">CYBERFATE</p>
              <h1 className="font-heading text-4xl sm:text-5xl text-[#1C1A16] mb-6">关于赛博命理师</h1>
              <p className="text-base text-[#1C1A16]/75 leading-relaxed font-sans">
                我们以 AI 推理框架重述八字、紫微、塔罗等传统学科，把每一次解读视作一次严谨的协作。品牌希望在暖白的空间里，陪伴你观察命运模式、梳理情绪与行动，找到兼具理性与诗意的生活节奏。
              </p>
            </div>
          </Container>
        </section>
      </div>

      <section className="pb-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {brandHighlights.map((highlight) => (
              <Card key={highlight.title} className="bg-white/90 backdrop-blur">
                <h2 className="font-heading text-2xl text-[#1C1A16] mb-3">{highlight.title}</h2>
                <p className="text-sm text-[#1C1A16]/70 leading-relaxed">{highlight.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <div className="text-center mb-10">
            <p className="text-sm tracking-[0.2em] text-[#1C1A16]/60">CORE VALUES</p>
            <h2 className="font-heading text-3xl text-[#1C1A16] mt-3">核心价值观</h2>
            <p className="max-w-2xl mx-auto text-sm text-[#1C1A16]/70 mt-4 leading-relaxed">
              每一条价值观都写进了产品体验：更透明的解释、更温柔的关照、更可执行的建议。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coreValues.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#1C1A16] text-white flex items-center justify-center">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-heading text-2xl">{title}</h3>
                </div>
                <p className="text-sm text-[#1C1A16]/70 leading-relaxed">{description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <Card className="bg-gradient-to-br from-[#F5F3EE] to-[#EDE9E2] text-[#1C1A16] border border-[#1C1A16]/10 shadow-lg" hover={false}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="font-heading text-3xl mb-4">我们相信理性与感性的并行</h3>
                <p className="text-sm text-[#1C1A16]/70 leading-relaxed">
                  当你与赛博命理师对话，我们提供的不只是结果，而是一套推理过程：背景假设、可执行的选择、以及必要的提醒。请携带你的经验与判断，与我们一起共创命运叙事。
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 text-sm leading-relaxed text-[#1C1A16]/70 shadow-sm border border-[#1C1A16]/10">
                <p>联系方式：feng5166@gmail.com</p>
                <p className="mt-2">办公地点：新加坡 · 远程协作团队</p>
                <p className="mt-2">合作方向：AI 算法共创、东方文化内容、心理咨询与疗愈项目</p>
              </div>
            </div>
          </Card>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
