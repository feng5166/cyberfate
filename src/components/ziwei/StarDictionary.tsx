'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { STAR_COLORS } from './types';
import { StarIcon } from './StarIcon';
import { wuxingColor } from '@/data/wuxing';

interface StarDictionaryPopoverProps {
  starName: string;
  children: React.ReactNode;
  className?: string;
}

interface StarEntry {
  name: string;
  alias: string;
  category: string;
  element: string;
  nature: string;
  keywords: string[];
  description: string;
}

const STAR_DICTIONARY: Record<string, StarEntry> = {
  '紫微': {
    name: '紫微',
    alias: '帝星、紫微大帝',
    category: '北斗主星',
    element: '土',
    nature: '阳',
    keywords: ['尊贵', '领导', '权威', '气度'],
    description: '紫微星为斗数之主星，有帝王之尊。入命者性格沉稳大气、有领导才能，好面子、重名誉。庙旺则贵气逼人，陷落则孤高自傲。',
  },
  '天机': {
    name: '天机',
    alias: '善星、智慧之星',
    category: '北斗主星',
    element: '木',
    nature: '阴',
    keywords: ['聪慧', '机变', '策划', '灵活'],
    description: '天机为智慧之星，主谋略与变化。入命者反应灵敏、善于思考分析，但心思太重易患得患失。适合从事策划、教育、研究等需要脑力的工作。',
  },
  '太阳': {
    name: '太阳',
    alias: '日星、光明之星',
    category: '中天主星',
    element: '火',
    nature: '阳',
    keywords: ['光明', '博爱', '贵显', '正直'],
    description: '太阳为光明之星，主贵显与施予。入命者心胸开阔、乐于助人、有公众影响力。庙旺主事业有成，陷落则劳碌无功。男命重事业，女命利夫运。',
  },
  '武曲': {
    name: '武曲',
    alias: '财星、将星',
    category: '北斗主星',
    element: '金',
    nature: '阴',
    keywords: ['财富', '刚毅', '果断', '行动力'],
    description: '武曲为第一财星，主刚毅果决。入命者性格直率、做事果断、理财能力强。但过刚则易折，需学会圆融处事。在财帛宫为最佳，主一生财运亨通。',
  },
  '天同': {
    name: '天同',
    alias: '福星、和合之星',
    category: '北斗主星',
    element: '水',
    nature: '阳',
    keywords: ['福气', '安逸', '和善', '享乐'],
    description: '天同为福星，主安逸享乐。入命者性格温和、乐观豁达、人缘好，但易安于现状、缺乏进取心。需有煞星激发方能成就大事。',
  },
  '廉贞': {
    name: '廉贞',
    alias: '官禄主、桃花星',
    category: '北斗主星',
    element: '火',
    nature: '阴',
    keywords: ['事业', '桃花', '才艺', '复杂'],
    description: '廉贞为官禄主，主事业与桃花。入命者才华横溢、能力出众，但感情复杂、好胜心强。庙旺则事业有成，陷落则官非口舌。兼具正桃花与偏桃花。',
  },
  '天府': {
    name: '天府',
    alias: '库星、南斗主星',
    category: '南斗主星',
    element: '土',
    nature: '阳',
    keywords: ['稳重', '富足', '保守', '积蓄'],
    description: '天府为库星，主稳重富足。入命者性格沉稳、善于理财储蓄、重视家庭。为富而不贵之星，适合从事金融、管理等稳定行业。',
  },
  '太阴': {
    name: '太阴',
    alias: '月星、财星',
    category: '中天主星',
    element: '水',
    nature: '阴',
    keywords: ['柔顺', '内敛', '艺术', '财富'],
    description: '太阴为月亮之星，主柔顺与财富。入命者性格温柔内敛、重感情、有艺术天赋。庙旺主富，陷落主劳碌。女命得太阴庙旺为佳，男命则利妻财。',
  },
  '贪狼': {
    name: '贪狼',
    alias: '桃花星、才艺星',
    category: '北斗主星',
    element: '水木',
    nature: '阳',
    keywords: ['欲望', '才艺', '桃花', '社交'],
    description: '贪狼为桃花才艺之星，主欲望与交际。入命者多才多艺、社交能力强、人缘极好，但欲望强烈、好享受。化禄为最佳，主一生多才多金。',
  },
  '巨门': {
    name: '巨门',
    alias: '暗星、口舌之星',
    category: '北斗主星',
    element: '水',
    nature: '阴',
    keywords: ['口才', '是非', '研究', '怀疑'],
    description: '巨门为暗星，主口舌是非。入命者口才出众、善于辩论分析，但多疑善变、易招是非。适合从事律师、教师、研究等需要口才的职业。化禄则口才生财。',
  },
  '天相': {
    name: '天相',
    alias: '印星、辅佐之星',
    category: '南斗主星',
    element: '水',
    nature: '阳',
    keywords: ['辅佐', '和谐', '信用', '协调'],
    description: '天相为印星，主辅佐与信用。入命者性格和善、处事公正、有协调能力，常为他人的得力助手。为官者得之大吉，主清廉正直。',
  },
  '七杀': {
    name: '七杀',
    alias: '将星、孤克之星',
    category: '南斗主星',
    element: '金火',
    nature: '阴',
    keywords: ['威严', '果断', '开创', '孤独'],
    description: '七杀为将星，主威严与权力。入命者勇猛果敢、有开创精神和领导魄力，但性急孤独、人生波折大。适合从事军警、外科、竞技等需要魄力的领域。',
  },
  '破军': {
    name: '破军',
    alias: '耗星、变动之星',
    category: '北斗主星',
    element: '水',
    nature: '阴',
    keywords: ['变动', '开创', '破旧', '冒险'],
    description: '破军为耗星，主变动与开创。入命者不安于现状、勇于冒险求变、破旧立新。庙旺则变动中获利，陷落则变动中损失。一生多变化，不宜守成。',
  },
  '天梁': {
    name: '天梁',
    alias: '荫星、清高之星',
    category: '南斗主星',
    element: '土',
    nature: '阳',
    keywords: ['正直', '清高', '保护', '长寿'],
    description: '天梁为荫星，主清高正直。入命者性格刚正、有正义感、喜欢助人，适合从事公职或慈善事业。有化解灾难的能力，为长寿之星。',
  },
  '文昌': {
    name: '文昌',
    alias: '科甲之星',
    category: '吉星',
    element: '金',
    nature: '阳',
    keywords: ['学业', '文才', '考试', '正途'],
    description: '文昌为科甲之星，主正途学业。同宫者利考试升学、文笔出众，为读书人的吉星。',
  },
  '文曲': {
    name: '文曲',
    alias: '才艺之星',
    category: '吉星',
    element: '水',
    nature: '阴',
    keywords: ['艺术', '才华', '异途', '浪漫'],
    description: '文曲为才艺之星，主异路功名。利艺术创作、音乐舞蹈等才艺表现，但也主桃花、口舌。',
  },
  '左辅': {
    name: '左辅',
    alias: '贵人星',
    category: '吉星',
    element: '土',
    nature: '阳',
    keywords: ['贵人', '助力', '稳重', '忠厚'],
    description: '左辅为贵人星，同宫者得正途贵人相助，事业稳步上升。为六吉之一，利升迁加薪。',
  },
  '右弼': {
    name: '右弼',
    alias: '贵人星',
    category: '吉星',
    element: '水',
    nature: '阴',
    keywords: ['人缘', '助力', '灵活', '机遇'],
    description: '右弼为贵人星，同宫者得异途贵人相助，人缘广泛、机遇多。与左辅合称左右贵人。',
  },
  '天魁': {
    name: '天魁',
    alias: '昼贵人',
    category: '吉星',
    element: '火',
    nature: '阳',
    keywords: ['贵人', '正途', '阳贵', '直接'],
    description: '天魁为阳贵人（昼贵人），主正途中贵人直接相助，利考试面试、升迁等正式场合。',
  },
  '天钺': {
    name: '天钺',
    alias: '夜贵人',
    category: '吉星',
    element: '火',
    nature: '阴',
    keywords: ['贵人', '暗助', '阴贵', '化险'],
    description: '天钺为阴贵人（夜贵人），主暗中有人相助、逢凶化吉，常在不知不觉中化解危机。',
  },
  '禄存': {
    name: '禄存',
    alias: '财禄之星',
    category: '吉星',
    element: '土',
    nature: '阴',
    keywords: ['财禄', '稳定', '收入', '保守'],
    description: '禄存为财禄之星，同宫者有稳定收入来源、善于积蓄。但也主孤独，有擎羊陀罗夹制之忧。',
  },
  '天马': {
    name: '天马',
    alias: '驿马星',
    category: '吉星',
    element: '火',
    nature: '阳',
    keywords: ['变动', '奔波', '机遇', '速度'],
    description: '天马为驿马星，主变动奔波、出外发展。与禄存同宫为"禄马交驰"大吉格，主财源广进。',
  },
  '擎羊': {
    name: '擎羊',
    alias: '刑星',
    category: '煞星',
    element: '金火',
    nature: '阳',
    keywords: ['刑伤', '阻碍', '刚强', '手术'],
    description: '擎羊为刑星，主刑伤阻碍。同宫者脾气暴躁、易有外伤手术。但与某些主星同宫反成格局。',
  },
  '陀罗': {
    name: '陀罗',
    alias: '忌星',
    category: '煞星',
    element: '金',
    nature: '阴',
    keywords: ['拖延', '纠缠', '内耗', '反复'],
    description: '陀罗为忌星，主拖延纠缠、做事反复。同宫者做事犹豫不决、常受小人牵制，需有决断力化解。',
  },
  '火星': {
    name: '火星',
    alias: '暴星',
    category: '煞星',
    element: '火',
    nature: '阳',
    keywords: ['急躁', '冲动', '爆发', '突变'],
    description: '火星为暴星，主急躁冲动、突发事件。同宫者脾气火爆、做事雷厉风行。与贪狼同宫为"火贪格"大吉。',
  },
  '铃星': {
    name: '铃星',
    alias: '暗火',
    category: '煞星',
    element: '火',
    nature: '阴',
    keywords: ['暗伤', '隐患', '固执', '闷骚'],
    description: '铃星为暗火，主内在隐患与暗伤。同宫者外表平静内心火热、固执难化。与贪狼同宫为"铃贪格"。',
  },
  '地空': {
    name: '地空',
    alias: '空星',
    category: '煞星',
    element: '火',
    nature: '阴',
    keywords: ['空想', '虚耗', '灵感', '哲学'],
    description: '地空为空星，主空想虚耗、钱财不聚。但也主灵感与哲学思维，适合从事宗教、艺术或创意行业。',
  },
  '地劫': {
    name: '地劫',
    alias: '劫星',
    category: '煞星',
    element: '火',
    nature: '阳',
    keywords: ['损耗', '破败', '意外', '变革'],
    description: '地劫为劫星，主损耗破败、意外损失。同宫者投资需谨慎、防意外损失。但也主创新变革之力。',
  },
  '天姚': {
    name: '天姚',
    alias: '桃花星',
    category: '杂曜',
    element: '水',
    nature: '阴',
    keywords: ['桃花', '魅力', '浪漫', '异性缘'],
    description: '天姚为桃花星，主异性缘旺盛、个人魅力突出。适度则增添人际魅力，过多则感情纷扰。',
  },
  '红鸾': {
    name: '红鸾',
    alias: '正桃花星',
    category: '杂曜',
    element: '水',
    nature: '阳',
    keywords: ['婚姻', '喜庆', '正缘', '感情'],
    description: '红鸾为正桃花星，主婚姻喜庆。流年逢之主有结婚或恋爱之喜。为四大桃花星中最正的一颗。',
  },
};

export function StarDictionaryPopover({ starName, children, className }: StarDictionaryPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const entry = STAR_DICTIONARY[starName];

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
      triggerRef.current && !triggerRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  if (!entry) {
    return <span className={className}>{children}</span>;
  }

  // 五行标签统一取自 WUXING 真源（单字命中即上色，复合/未知回退中性灰）
  const elementColor = wuxingColor(entry.element);

  return (
    <span className={cn('relative inline-flex', className)} ref={triggerRef}>
      <span
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer hover:underline decoration-dotted underline-offset-4 decoration-[#1C1A16]/20"
        role="button"
        aria-expanded={isOpen}
        aria-label={`查看${starName}详情`}
      >
        {children}
      </span>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-[#F0EDE8] p-4 animate-fadeIn"
          role="dialog"
          aria-label={`${starName}星曜详解`}
        >
          {/* 箭头 */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-[#F0EDE8] rotate-45" />

          {/* 关闭 */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 p-1 rounded hover:bg-[#FAF9F6] text-[#1C1A16]/30 hover:text-[#1C1A16]"
            aria-label="关闭"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* 标题 */}
          <div className="flex items-center gap-2 mb-3">
            <StarIcon starName={starName} size={12} />
            <h4
              className="text-base font-bold"
              style={{ color: STAR_COLORS[starName] || '#1C1A16' }}
            >
              {entry.name}
            </h4>
            <span className="text-[10px] text-[#1C1A16]/35">{entry.alias}</span>
          </div>

          {/* 属性 */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E8E4DD] text-[#1C1A16]/60">
              {entry.category}
            </span>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: elementColor.bg, color: elementColor.text }}
            >
              五行 {entry.element}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E8E4DD] text-[#1C1A16]/60">
              {entry.nature}性
            </span>
          </div>

          {/* 关键词 */}
          <div className="flex flex-wrap gap-1 mb-3">
            {entry.keywords.map((kw) => (
              <span
                key={kw}
                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100"
              >
                {kw}
              </span>
            ))}
          </div>

          {/* 描述 */}
          <p className="text-xs text-[#1C1A16]/60 leading-relaxed">
            {entry.description}
          </p>
        </div>
      )}
    </span>
  );
}
