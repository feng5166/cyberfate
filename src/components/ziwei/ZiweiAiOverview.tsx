'use client';

import { useState, useCallback, useMemo } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getAge, getBirthYear, getGanZhi, getCurrentDayunIndex, STARTING_AGE, DAYUN_SPAN } from '@/lib/utils/dayun';
import type { PalaceData } from './types';

interface ZiweiAiOverviewProps {
  palaces: PalaceData[];
  birthDate?: string; // 'YYYY-MM-DD'
  className?: string;
}

const TABS = [
  { key: 'overview', label: '命盘总览' },
  { key: 'sihua', label: '人生四化' },
  { key: 'dayun', label: '大运流年' },
] as const;

type TabKey = typeof TABS[number]['key'];

const DAYUN_LABELS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

const DAYUN_PALACE_DETAILS: Record<number, { palace: string; star: string; content: string }> = {
  0: { palace: '命宫', star: '紫微天府', content: '此大运得紫微天府守护，整体运势平稳上升，贵人运旺，适合打基础。' },
  1: { palace: '兄弟', star: '太阳', content: '此大运太阳旺度，学业顺利，人际交往活跃，社交圈扩展期。' },
  2: { palace: '夫妻', star: '武曲天相', content: '此大运武曲天相同度，事业起步期，感情运稳定，利于建立长期关系。' },
  3: { palace: '官禄', star: '七杀', content: '此大运为事业冲刺期，七杀星主导力量强，适合拼搏进取。工作中将面临较大挑战，但也是建功立业的黄金时期。注意控制脾气与风险，不宜过度冒进。' },
  4: { palace: '财帛', star: '贪狼化禄', content: '此大运贪狼化禄入财帛，财运亨通，收入渠道多元，适合投资理财与事业拓展。社交带来财运，把握人脉资源。' },
  5: { palace: '迁移', star: '廉贞', content: '此大运廉贞平度守迁移，宜稳不宜动，安定为上。出行需谨慎，注意身体健康保养。' },
  6: { palace: '交友', star: '天同巨门', content: '此大运天同巨门同度，生活平稳，宜守不宜攻，人际关系需用心维护。' },
  7: { palace: '田宅', star: '太阴', content: '此大运太阴旺度，家宅运顺，利于置业安家，家庭关系融洽。' },
  8: { palace: '福德', star: '天梁', content: '此大运天梁坐守，精神生活丰富，名望提升，宜修身养性。' },
  9: { palace: '父母', star: '破军', content: '此大运破军独坐，变动较大，需审慎决策，不宜冒进。' },
};

function getDayunContent(birthDate: string): string {
  const currentYear = new Date().getFullYear();
  const birthYear = getBirthYear(birthDate);
  const currentAge = getAge(birthDate);
  const dayunIndex = getCurrentDayunIndex(currentAge);

  const startAge = STARTING_AGE + dayunIndex * DAYUN_SPAN;
  const endAge = startAge + DAYUN_SPAN - 1;
  const startYear = birthYear + startAge;
  const endYear = birthYear + endAge;
  const label = DAYUN_LABELS[dayunIndex] ?? `${dayunIndex + 1}`;
  const detail = DAYUN_PALACE_DETAILS[dayunIndex % Object.keys(DAYUN_PALACE_DETAILS).length];
  const yearGanZhi = getGanZhi(currentYear).full;

  const prevIndex = Math.max(0, dayunIndex - 1);
  const nextIndex = Math.min(Object.keys(DAYUN_PALACE_DETAILS).length - 1, dayunIndex + 1);
  const prevDetail = DAYUN_PALACE_DETAILS[prevIndex % Object.keys(DAYUN_PALACE_DETAILS).length];
  const nextDetail = DAYUN_PALACE_DETAILS[nextIndex % Object.keys(DAYUN_PALACE_DETAILS).length];

  const progressPercent = Math.round(((currentAge - startAge) / DAYUN_SPAN) * 100);
  const remainingYears = endAge - currentAge;

  return `【当前大运】第${label}大运（${startAge}-${endAge}岁，${startYear}-${endYear}年）
大运走到${detail.palace}，主星：${detail.star}

您当前 ${currentAge} 岁，正处于第${label}大运之中，已走过此大运的 ${progressPercent}%，距离下一大运还有 ${remainingYears} 年。

${detail.content}

与上一大运（走${prevDetail.palace}，${prevDetail.star}）相比，当前大运的重心有所转移。${dayunIndex > prevIndex ? `从${prevDetail.palace}过渡到${detail.palace}，人生焦点从${prevDetail.palace.replace('宫', '')}领域转向${detail.palace.replace('宫', '')}领域。` : ''}展望下一大运将走${nextDetail.palace}（${nextDetail.star}），建议在当前大运末期提前做好过渡准备。

【${currentYear} ${yearGanZhi}年 流年运势】

今年 ${currentAge} 岁，流年${yearGanZhi}。在第${label}大运的框架下，今年的流年运势呈现以下特点：

• 事业运：武曲天相助力事业宫，工作上有贵人提携，适合争取晋升或拓展新项目。下半年运势优于上半年，秋季（农历八九月）为关键转折期，把握此窗口可获得突破性进展。

• 财运：贪狼化禄的本命格局在今年得到流年财星加持，正财偏财均有进项。投资理财可适度积极，但避免大额投机。

• 感情运：流年桃花星入夫妻宫，已婚者家庭和谐，未婚者有望遇到合适对象。社交场合多留意身边的异性贵人。

• 健康运：巨门化忌的影响在秋冬季节较为明显，注意肠胃保养与情绪管理。建议坚持规律运动，每周至少三次有氧锻炼。

【近期行动建议】
• 上半年（1-6月）：注重人际关系维护，防小人口舌，低调积累资源
• 下半年（7-12月）：事业机遇期，主动出击，把握晋升与合作机会
• 全年重点：财运稳中有升，适度投资理财；定期体检，关注消化系统健康`;
}

const STATIC_TAB_CONTENT: Record<'overview' | 'sihua', { title: string; content: string }> = {
  overview: {
    title: '命盘总览',
    content: `此命盘紫微天府同宫于命宫（庚辰），为"紫府同宫"上格，格局清正高贵，属命理中难得的贵格之一。命主天生具有领导气质与组织才能，性格沉稳大气，处事有条不紊，凡事能谋定而后动，在同辈中常为中心人物。

文昌旺度、左辅庙度同会命宫，主聪慧好学、口才出众、得贵人相助，学业事业均有所成。文昌星助力文笔与表达，适合从事需要沟通协调的职业；左辅星则带来忠诚可靠的合作伙伴，事业上不乏助力。

财帛宫（甲申）贪狼旺度坐守，右弼天钺同会，求财途径多元，善于把握商机，中年后财运明显转旺。贪狼星在财帛主善于社交求财，配合右弼天钺两颗贵人星，往往能通过人脉关系拓展财源。

官禄宫（戊子）七杀独坐旺地，事业心强烈，执行力出色，适合开创性工作、技术领域或管理岗位。七杀旺地主开拓进取，虽压力较大但成就感强。但迁移宫（丙戌）廉贞平度会火星地空，出外发展需谨慎，不宜频繁变动工作地点。

整体格局属中上之命，一生有贵气扶持，事业可成，财运不缺，但需注意健康与人际关系的维护。疾厄宫（乙酉）天同巨门同度、擎羊同宫，中年后需格外注意消化系统与精神压力的调节，保持规律作息是长远之福。`,
  },
  sihua: {
    title: '人生四化飞星',
    content: `【化禄 — 贪狼化禄在财帛宫】
贪狼化禄飞入财帛宫，是四化中最为吉利的格局之一。主一生财路亨通，尤其在营销、艺术、交际、餐饮等领域求财顺利。贪狼本身为桃花星，化禄后人缘极佳，善于通过社交活动与人脉资源获取财富。中年后此星力量更强，财运将有质的飞跃。需注意：财来得快也需善于守财，避免过度消费与投机。

【化权 — 紫微化权在命宫】
紫微帝星本就高贵，化权后更添权势与决断力。命主在人群中自然居于核心地位，领导力与控制欲都很强。事业上能独当一面，不惧挑战，善于把握全局。此化权与化禄同源于命宫年干，形成"禄权同源"的格局，主事业与财运双旺。但需防过度强势而影响人际关系，学会适时示弱与倾听，方能让领导力发挥到极致。

【化科 — 天机化科在交友宫】
天机为智慧星，化科后更显文雅与学识。飞入交友宫，表示命主在社交中多得学识渊博之人指点，朋友圈层次较高，多为文化界、学术界人士。天机化科也主学习能力极强，善于从各种渠道获取知识与信息，特别适合终身学习。建议多参加高端社交活动与学术交流，贵人往往出现在这些场合。

【化忌 — 巨门化忌在疾厄宫】
巨门为暗曜，主口舌是非，化忌后负面力量加强。落在疾厄宫，健康方面需特别注意消化系统（胃肠）、口腔、咽喉等问题，也暗示容易因言语不当或口舌纷争引发精神压力。建议保持心态平和，说话谨慎，少与人争辩。定期体检尤为重要。

【四化总评】
禄权入命财，科星助友，仅忌星落疾厄，属于上吉格局。事业与财运为人生主要优势，人际圈层高端。唯一需要关注的是健康维护——保养好身体，方能享受事业与财运带来的丰盛成果。`,
  },
};

export function ZiweiAiOverview({ palaces, birthDate, className }: ZiweiAiOverviewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const TAB_CONTENT = useMemo(() => {
    const dayunContent = birthDate
      ? getDayunContent(birthDate)
      : getDayunContent(`${new Date().getFullYear() - 30}-01-01`);
    return {
      ...STATIC_TAB_CONTENT,
      dayun: { title: '大运流年', content: dayunContent },
    };
  }, [birthDate]);

  const handleCopy = useCallback(async () => {
    const text = TAB_CONTENT[activeTab].content;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [activeTab, TAB_CONTENT]);

  const content = TAB_CONTENT[activeTab];

  return (
    <div
      className={cn('bg-white rounded-2xl shadow-sm border border-[#F0EDE8] overflow-hidden', className)}
      role="region"
      aria-label="AI 命盘解读"
    >
      {/* 标题栏 */}
      <div className="px-5 sm:px-6 pt-5 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-display text-lg font-semibold text-[#1C1A16]">AI 命盘解读</h3>
        </div>

        {/* Tab 切换（SegmentedControl 样式） */}
        <div className="flex rounded-xl bg-[#FAF9F6] border border-[#E8E4DD] p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 px-4 py-2 text-sm rounded-lg transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-white text-[#1C1A16] font-medium shadow-sm'
                  : 'text-[#1C1A16]/50 hover:text-[#1C1A16]/70',
              )}
              aria-selected={activeTab === tab.key}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 内容区 */}
      <div className="px-5 sm:px-6 py-5" role="tabpanel" aria-label={content.title}>
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <>
            <div className="whitespace-pre-line text-sm text-[#1C1A16]/70 leading-relaxed">
              {content.content}
            </div>

            {/* 复制按钮 */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs text-[#1C1A16]/40 hover:text-[#1C1A16]/70 transition-colors px-3 py-1.5 rounded-lg hover:bg-[#FAF9F6]"
                aria-label="复制解读内容"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-3 animate-pulse" aria-label="加载中">
      <div className="h-4 bg-[#E8E4DD]/50 rounded-full w-full" />
      <div className="h-4 bg-[#E8E4DD]/50 rounded-full w-[90%]" />
      <div className="h-4 bg-[#E8E4DD]/50 rounded-full w-[95%]" />
      <div className="h-4 bg-[#E8E4DD]/50 rounded-full w-[80%]" />
      <div className="h-4 bg-[#E8E4DD]/50 rounded-full w-[85%]" />
      <div className="h-4 bg-[#E8E4DD]/50 rounded-full w-[60%]" />
    </div>
  );
}
