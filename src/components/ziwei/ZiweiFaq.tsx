'use client';

const FAQ_ITEMS = [
  {
    question: '什么是紫微斗数？',
    answer:
      '紫微斗数是中国传统命理学中最精密的推算术之一，起源于宋代，以紫微星为核心，通过十四颗主星和众多辅星在十二宫的分布来推断人的命运轨迹。它被誉为"天下第一神数"，在准确性和系统性上享有极高声誉。',
  },
  {
    question: '紫微排盘准确吗？',
    answer:
      '紫微斗数排盘的准确性取决于出生时间的精确度。本平台采用标准紫微斗数排盘算法，星曜安布严格遵循传统规则。只要出生时间准确（尤其是时辰），排出的命盘就是精准的。AI 解读部分则结合现代语言帮助理解传统命理含义。',
  },
  {
    question: '十四主星是什么？',
    answer:
      '十四主星是紫微斗数的核心星曜，包括：紫微、天机、太阳、武曲、天同、廉贞（北斗六星）和天府、太阴、贪狼、巨门、天相、七杀、破军、天梁（南斗八星，含天梁）。每颗主星代表不同的性格特质和命运走向，它们在十二宫中的分布构成了命盘的基本格局。',
  },
  {
    question: '为什么需要出生时辰？',
    answer:
      '紫微斗数对出生时辰极为敏感。不同的时辰会导致命宫位置不同，进而影响所有十二宫的排列和星曜分布。即使同年同月同日出生，不同时辰的命盘可能完全不同。因此准确的出生时辰是排出正确命盘的关键要素。如果不确定时辰，建议咨询长辈或查阅出生记录。',
  },
  {
    question: '紫微斗数 vs 八字有什么区别？',
    answer:
      '八字（四柱）以天干地支组合推算，侧重五行生克关系；紫微斗数以星曜在宫位的分布推算，信息更加丰富细腻。八字如同命运的骨架，紫微斗数则是血肉丰满的详图。两者可互相参照：八字看大势格局，紫微看具体事项。本平台同时提供两种分析，助你全方位了解命运密码。',
  },
];

export function ZiweiFaq() {
  return (
    <section aria-label="常见问题">
      <h2 className="font-display text-xl md:text-2xl font-semibold text-[#1C1A16] text-center mb-6">
        常见问题
      </h2>
      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.question}
            open
            className="group rounded-xl border border-[#1C1A16]/8 bg-white px-5 py-4"
          >
            <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-medium text-[#1C1A16]">
              <span className="pr-4">{item.question}</span>
              <span aria-hidden className="text-[#1C1A16]/40 shrink-0 group-open:rotate-180 transition-transform">⌄</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-[#1C1A16]/60">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
