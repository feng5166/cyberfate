'use client';

import type { PillarRecord, TianGan } from '@/lib/bazi/types';
import { getTenGod, type TenGod } from '@/lib/bazi/helpers';
import { cn } from '@/lib/utils/cn';

interface ShishenDetailTabProps {
  pillars: PillarRecord;
  dayGan: TianGan;
}

interface ShishenInfo {
  name: TenGod;
  meaning: string;
  influence: string;
}

const SHISHEN_DATA: Record<TenGod, { meaning: string; positiveInfluence: string; negativeInfluence: string }> = {
  '正财': {
    meaning: '正常收入、稳定财富、保守理财',
    positiveInfluence: '工作稳定，收入规律，擅长积累财富。',
    negativeInfluence: '过度看重物质，可能缺乏冒险精神。',
  },
  '偏财': {
    meaning: '投资收益、意外之财、商业机会',
    positiveInfluence: '善于抓住商机，财源广进，适合创业。',
    negativeInfluence: '财运波动较大，需谨慎投资决策。',
  },
  '正官': {
    meaning: '地位、权力、纪律、上司缘',
    positiveInfluence: '适合体制内发展，受上级赏识，晋升顺利。',
    negativeInfluence: '过度追求稳定，可能束缚个人自由。',
  },
  '七杀': {
    meaning: '压力、挑战、魄力、变革动力',
    positiveInfluence: '敢于拼搏，执行力强，适合竞争环境。',
    negativeInfluence: '压力较大，容易树敌，需注意身心平衡。',
  },
  '正印': {
    meaning: '学历、名誉、母亲、保护力',
    positiveInfluence: '学习能力强，文化修养高，贵人运佳。',
    negativeInfluence: '过度依赖他人，可能缺乏独立性。',
  },
  '偏印': {
    meaning: '独特思维、专业技能、偏门学问',
    positiveInfluence: '思维独特，擅长专业领域，适合研究工作。',
    negativeInfluence: '容易钻牛角尖，人际关系可能疏离。',
  },
  '食神': {
    meaning: '才艺、享受、口福、表达力',
    positiveInfluence: '生活品味高，善于表达，人际和谐。',
    negativeInfluence: '过度享乐，可能缺乏进取心。',
  },
  '伤官': {
    meaning: '创造力、叛逆、才华外露',
    positiveInfluence: '才华横溢，创意十足，适合艺术和创意工作。',
    negativeInfluence: '容易口舌是非，与权威冲突。',
  },
  '劫财': {
    meaning: '竞争、朋友、花销、冒险',
    positiveInfluence: '朋友众多，善于合作，敢于冒险。',
    negativeInfluence: '花销较大,容易因朋友破财。',
  },
  '比肩': {
    meaning: '自信、独立、同行、合伙',
    positiveInfluence: '自信独立，适合创业或合伙事业。',
    negativeInfluence: '过度自我，可能影响团队协作。',
  },
  '日主': {
    meaning: '自我、本我、核心特质',
    positiveInfluence: '本命核心，代表自我意识和生命力。',
    negativeInfluence: '无',
  },
  '未知': {
    meaning: '未能识别的十神',
    positiveInfluence: '暂无',
    negativeInfluence: '暂无',
  },
};

export function ShishenDetailTab({ pillars, dayGan }: ShishenDetailTabProps) {
  // 提取命盘中的十神
  const presentShishen = new Set<TenGod>();
  const pillarGans = [pillars.year.gan, pillars.month.gan, pillars.hour.gan];
  
  pillarGans.forEach(gan => {
    const tenGod = getTenGod(dayGan, gan);
    if (tenGod !== '未知') {
      presentShishen.add(tenGod);
    }
  });

  // 添加日主
  presentShishen.add('日主');

  // 所有十神列表（按重要性排序）
  const allShishen: TenGod[] = [
    '日主',
    '正财', '偏财',
    '正官', '七杀',
    '正印', '偏印',
    '食神', '伤官',
    '劫财', '比肩',
  ];

  const shishenList: Array<ShishenInfo & { isPresent: boolean }> = allShishen.map(name => {
    const data = SHISHEN_DATA[name];
    const isPresent = presentShishen.has(name);
    
    return {
      name,
      meaning: data.meaning,
      influence: isPresent ? data.positiveInfluence : data.negativeInfluence,
      isPresent,
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {shishenList.map(item => (
        <div
          key={item.name}
          className={cn(
            'rounded-xl border p-4',
            item.isPresent
              ? 'border-emerald-200 bg-emerald-50/50'
              : 'border-[rgba(28,26,22,0.08)] bg-[#FAF9F6]'
          )}
        >
          {/* 十神名 + 出现状态 */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-base font-semibold text-[#1C1A16]">{item.name}</h4>
            {item.isPresent && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                ✓ 命盘出现
              </span>
            )}
          </div>

          {/* 基本含义 */}
          <p className="text-sm text-[#1C1A16]/70 leading-relaxed mb-2">
            {item.meaning}
          </p>

          {/* 对命主的影响 */}
          <p className="text-sm text-[#1C1A16] leading-relaxed">
            {item.influence}
          </p>
        </div>
      ))}
    </div>
  );
}
