'use client';

import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PalaceData, STAR_COLORS } from './types';
import { StarIcon } from './StarIcon';

interface PalaceDetailPanelProps {
  palace: PalaceData;
  onClose: () => void;
  className?: string;
}

const BRIGHTNESS_TAG_STYLES: Record<string, string> = {
  '庙': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '旺': 'bg-blue-50 text-blue-700 border-blue-200',
  '得': 'bg-amber-50 text-amber-700 border-amber-200',
  '利': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  '平': 'bg-gray-50 text-gray-600 border-gray-200',
  '不': 'bg-orange-50 text-orange-600 border-orange-200',
  '陷': 'bg-red-50 text-red-600 border-red-200',
};

const TYPE_LABELS: Record<string, string> = {
  major: '主星',
  minor: '辅星',
  auxiliary: '吉星',
  evil: '煞星',
};

const PALACE_AI_READINGS: Record<string, { reading: string; score: number }> = {
  '命宫': {
    reading: '命宫坐紫微天府双星庙旺，为帝星会库星之格，天生具有领导气质与组织才能。文昌左辅同宫，主聪慧好学、人缘广博，得贵人相助。格局属"紫府同宫"上格，一生运势较为顺遂，宜从事管理、决策类事业。性格沉稳大气，但需注意固执己见之弊。',
    score: 92,
  },
  '兄弟': {
    reading: '兄弟宫太阳旺度入驻，主兄弟姐妹中有能力出众者，手足情谊深厚。天魁同宫助力，代表兄弟中不乏贵人。太阳为光明之星，兄弟多为坦荡正直之人。整体而言，手足关系和睦，互相扶持。',
    score: 85,
  },
  '夫妻': {
    reading: '夫妻宫武曲天相同度，武曲主刚毅果断，天相主温和圆融，配偶性格兼具果决与包容。文曲同宫增添浪漫情调。感情基础稳固，但武曲过刚需注意沟通方式，避免因钱财观念不同而起争执。',
    score: 80,
  },
  '子女': {
    reading: '子女宫太阴陷落，主与子女缘分稍薄，子女性格偏内向敏感。铃星同宫增添波折，教育子女需多付出耐心。建议以温和引导代替严厉管教，关注子女情绪健康。子女数量以一至二为宜。',
    score: 62,
  },
  '财帛': {
    reading: '财帛宫贪狼旺度坐守，主求财途径多元，善于发现商机。右弼天钺双吉星同宫，代表财路上多得贵人提携与合作机会。贪狼主欲望，财运佳但需防投机取巧。适合从事营销、艺术或交际类行业求财。',
    score: 88,
  },
  '疾厄': {
    reading: '疾厄宫天同巨门同度，天同主安逸、巨门主口舌是非。健康方面需注意消化系统与口腔问题。擎羊煞星同宫，提示注意外伤与手术风险。建议保持规律作息，减少精神压力，定期体检。',
    score: 65,
  },
  '迁移': {
    reading: '迁移宫廉贞平度坐守，出外运势平稳但需付出努力。火星地空双煞同宫，外出易遇突发状况或空想不切实际。适合在熟悉的领域发展，频繁更换环境反而不利。出行需注意安全与人际关系维护。',
    score: 58,
  },
  '交友': {
    reading: '交友宫天机天梁双星庙旺同度，交友广泛且多为有学识、有思想之人。陀罗同宫略有小人之忧，需慎选知己。天机主变化灵活，天梁主清高正直，交友中能获得智慧启迪。宜深交少数知心好友。',
    score: 78,
  },
  '官禄': {
    reading: '官禄宫七杀旺度独坐，主事业心强、有开创精神与魄力。七杀为将星，适合竞争激烈的行业或开拓性工作。地劫同宫需防事业中的财务漏洞。整体事业运旺盛，适合技术、军警或创业领域，忌安逸守成。',
    score: 82,
  },
  '田宅': {
    reading: '田宅宫破军庙旺坐守，主居住环境多变动，喜欢翻新装修。禄存同宫主不动产运势佳，有置业积蓄之象。破军虽主变化，但庙旺则变中有利。中年后置业运转好，适合投资不动产。',
    score: 83,
  },
  '福德': {
    reading: '福德宫无主星，借对宫天同巨门之力。天马同宫主内心不安定、思绪活跃，精神世界丰富但容易胡思乱想。需培养定心功夫，如冥想或书法。晚年需注意精神健康，多与积极乐观之人交往。',
    score: 68,
  },
  '父母': {
    reading: '父母宫无主星，天姚红鸾同宫，主与父母关系中带有感情色彩，父母可能有艺术气质或婚姻故事。与父母缘分尚可，但沟通需用心经营。红鸾主人缘佳，受长辈喜爱，天姚增添浪漫气息。',
    score: 72,
  },
};

export function PalaceDetailPanel({ palace, onClose, className }: PalaceDetailPanelProps) {
  const allStars = [
    ...palace.majorStars.map((s) => ({ ...s, typeLabel: TYPE_LABELS[s.type] || s.type })),
    ...palace.minorStars.map((s) => ({ ...s, typeLabel: TYPE_LABELS[s.type] || s.type })),
  ];

  const aiData = PALACE_AI_READINGS[palace.name] || {
    reading: `${palace.name}的星曜组合独特，需综合全盘分析方能给出准确解读。建议结合大运流年做进一步推算。`,
    score: 70,
  };

  return (
    <div
      className={cn('bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-5 sm:p-6 relative', className)}
      role="region"
      aria-label={`${palace.name}详情`}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[#FAF9F6] transition-colors text-[#1C1A16]/40 hover:text-[#1C1A16]"
        aria-label="关闭详情面板"
      >
        <X className="w-4 h-4" />
      </button>

      {/* 区块1: 宫位基本信息 */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="font-display text-xl font-bold text-[#1C1A16]">{palace.name}</h3>
          <span className="text-sm text-[#1C1A16]/50">
            {palace.stem}{palace.branch}
          </span>
          {palace.isLife && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C1A16]/8 text-[#1C1A16]/70 font-medium">
              命宫
            </span>
          )}
        </div>

        {/* 属性 Tag 组 */}
        <div className="flex flex-wrap gap-2">
          {allStars
            .filter((s) => s.brightness)
            .map((star) => (
              <span
                key={star.name}
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border',
                  BRIGHTNESS_TAG_STYLES[star.brightness!] || 'bg-gray-50 text-gray-600 border-gray-200',
                )}
              >
                <StarIcon starName={star.name} size={6} />
                {star.name}
                <span className="font-medium">{star.brightness}</span>
              </span>
            ))}
        </div>
      </div>

      {/* 区块2: 星曜列表表格 */}
      <div className="mb-5">
        <h4 className="text-sm font-medium text-[#1C1A16]/60 mb-3">星曜列表</h4>
        <div className="rounded-xl border border-[#E8E4DD] overflow-hidden">
          <div className="grid grid-cols-[72px_1fr_80px_64px_1fr] gap-0 text-xs bg-[#FAF9F6] border-b border-[#E8E4DD] px-4 py-2.5 font-medium text-[#1C1A16]/50 hidden sm:grid">
            <span>类型</span>
            <span>星曜</span>
            <span>亮度</span>
            <span>庙旺陷</span>
            <span>说明</span>
          </div>

          {allStars.map((star) => (
            <div
              key={star.name}
              className={cn(
                'px-4 py-3 border-b border-[#E8E4DD] last:border-b-0',
                'flex flex-col sm:grid sm:grid-cols-[72px_1fr_80px_64px_1fr] sm:items-center gap-1 sm:gap-0',
              )}
            >
              {/* 类型 */}
              <span
                className={cn(
                  'text-[11px] font-medium sm:text-xs',
                  star.type === 'evil' ? 'text-red-500' : 'text-[#1C1A16]/50',
                )}
              >
                {star.typeLabel}
              </span>

              {/* 星曜名 */}
              <div className="flex items-center gap-2">
                <StarIcon starName={star.name} size={8} />
                <span
                  className={cn(
                    'font-semibold',
                    star.type === 'major' ? 'text-base' : 'text-sm',
                    star.type === 'evil' && 'text-red-500',
                  )}
                  style={star.type !== 'evil' ? { color: STAR_COLORS[star.name] || '#1C1A16' } : undefined}
                >
                  {star.name}
                </span>
              </div>

              {/* 亮度（星级） */}
              <div className="flex items-center gap-0.5">
                {star.brightness
                  ? Array.from({ length: getBrightnessLevel(star.brightness) }).map((_, i) => (
                      <span key={i} className="text-amber-400 text-xs">★</span>
                    ))
                  : <span className="text-[#1C1A16]/20 text-xs">—</span>}
              </div>

              {/* 庙旺陷 */}
              {star.brightness ? (
                <span
                  className={cn(
                    'inline-flex w-fit text-[11px] px-2 py-0.5 rounded border font-medium',
                    BRIGHTNESS_TAG_STYLES[star.brightness],
                  )}
                >
                  {star.brightness}
                </span>
              ) : (
                <span className="text-[#1C1A16]/20 text-xs">—</span>
              )}

              {/* 说明 */}
              <span className="text-xs text-[#1C1A16]/40 hidden sm:block">
                {getStarDescription(star.name, star.type)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 区块3: AI 宫位解读 */}
      <div className="rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-semibold text-[#1C1A16]">AI 宫位解读</h4>
        </div>
        <p className="text-sm text-[#1C1A16]/70 leading-relaxed mb-4">
          {aiData.reading}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#1C1A16]/40">综合评分</span>
          <div className="flex-1 h-2 rounded-full bg-amber-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-500"
              style={{ width: `${aiData.score}%` }}
            />
          </div>
          <span className="text-sm font-bold text-amber-600">{aiData.score}/100</span>
        </div>
      </div>
    </div>
  );
}

function getBrightnessLevel(brightness: string): number {
  const levels: Record<string, number> = {
    '庙': 5, '旺': 4, '得': 3, '利': 3, '平': 2, '不': 1, '陷': 1,
  };
  return levels[brightness] || 2;
}

function getStarDescription(name: string, type: string): string {
  const descriptions: Record<string, string> = {
    '紫微': '帝星，主尊贵、领导',
    '天机': '智慧之星，主谋略',
    '太阳': '光明之星，主贵显',
    '武曲': '财星，主刚毅果断',
    '天同': '福星，主安逸享乐',
    '廉贞': '官禄主，主事业桃花',
    '天府': '库星，主稳重富足',
    '太阴': '财星，主柔顺内敛',
    '贪狼': '桃花星，主欲望才艺',
    '巨门': '暗星，主口舌是非',
    '天相': '印星，主辅佐和谐',
    '七杀': '将星，主威严权力',
    '破军': '耗星，主变动开创',
    '天梁': '荫星，主清高正直',
    '文昌': '科甲之星，利学业',
    '文曲': '才艺之星，利文艺',
    '左辅': '贵人星，助力事业',
    '右弼': '贵人星，助力人缘',
    '天魁': '昼贵人，主正途助力',
    '天钺': '夜贵人，主暗中相助',
    '禄存': '财禄之星，主稳定收入',
    '天马': '驿马星，主变动奔波',
    '擎羊': '刑星，主刑伤阻碍',
    '陀罗': '忌星，主拖延纠缠',
    '火星': '暴星，主急躁冲动',
    '铃星': '暗火，主隐患暗伤',
    '地空': '空星，主空想虚耗',
    '地劫': '劫星，主损耗破败',
  };
  return descriptions[name] || `${type === 'evil' ? '煞星' : '辅星'}，需综合判断`;
}
