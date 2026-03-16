// 塔罗牌数据
export interface TarotCard {
  id: number;
  name_en: string;
  name_zh: string;
  suit: 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
  number: number;
  keywords: string[];
  upright: string;
  reversed: string;
}

// 大阿尔卡那（22张）
export const majorArcana: TarotCard[] = [
  {
    id: 0,
    name_en: 'The Fool',
    name_zh: '愚者',
    suit: 'major',
    number: 0,
    keywords: ['新开始', '冒险', '纯真', '自由'],
    upright: '代表新的开始、冒险精神和无限可能。保持开放的心态，勇敢踏出第一步。',
    reversed: '鲁莽、缺乏计划、逃避责任。需要更谨慎地思考行动。'
  },
  {
    id: 1,
    name_en: 'The Magician',
    name_zh: '魔术师',
    suit: 'major',
    number: 1,
    keywords: ['创造力', '技能', '行动力', '资源'],
    upright: '拥有实现目标的能力和资源。善用你的才能，将想法付诸实践。',
    reversed: '缺乏方向、滥用才能、操纵他人。需要重新审视自己的动机。'
  },
  {
    id: 2,
    name_en: 'The High Priestess',
    name_zh: '女祭司',
    suit: 'major',
    number: 2,
    keywords: ['直觉', '神秘', '潜意识', '智慧'],
    upright: '倾听内心的声音，相信直觉。答案在你心中，静下来感受。',
    reversed: '忽视直觉、秘密被揭露、情绪压抑。需要重新连接内在智慧。'
  },
  {
    id: 6,
    name_en: 'The Lovers',
    name_zh: '恋人',
    suit: 'major',
    number: 6,
    keywords: ['爱情', '选择', '和谐', '价值观'],
    upright: '重要的选择、和谐的关系、价值观的统一。跟随你的心。',
    reversed: '关系失衡、价值观冲突、错误的选择。需要重新审视关系。'
  },
  {
    id: 10,
    name_en: 'Wheel of Fortune',
    name_zh: '命运之轮',
    suit: 'major',
    number: 10,
    keywords: ['转变', '机遇', '命运', '循环'],
    upright: '命运的转折点，好运即将到来。顺应变化，把握机遇。',
    reversed: '运气不佳、抗拒变化、失控。接受生命的起伏。'
  },
  {
    id: 13,
    name_en: 'Death',
    name_zh: '死神',
    suit: 'major',
    number: 13,
    keywords: ['结束', '转变', '重生', '放手'],
    upright: '旧事物的结束，新开始的前奏。放下过去，拥抱转变。',
    reversed: '抗拒改变、停滞不前、无法放手。需要接受结束。'
  },
  {
    id: 17,
    name_en: 'The Star',
    name_zh: '星星',
    suit: 'major',
    number: 17,
    keywords: ['希望', '灵感', '平静', '疗愈'],
    upright: '希望和灵感的到来，内心的平静。保持信念，未来光明。',
    reversed: '失去信心、缺乏方向、绝望。需要重新找回希望。'
  },
  {
    id: 21,
    name_en: 'The World',
    name_zh: '世界',
    suit: 'major',
    number: 21,
    keywords: ['完成', '成就', '圆满', '整合'],
    upright: '目标达成、圆满结局、新的循环开始。庆祝你的成就。',
    reversed: '未完成、缺乏闭环、延迟。需要最后的努力。'
  },
  // 权杖牌组（代表）
  {
    id: 22,
    name_en: 'Ace of Wands',
    name_zh: '权杖王牌',
    suit: 'wands',
    number: 1,
    keywords: ['创意', '灵感', '新项目', '热情'],
    upright: '新的创意和机会，充满热情的开始。抓住灵感，立即行动。',
    reversed: '缺乏方向、延迟、失去热情。需要重新点燃激情。'
  },
  // 圣杯牌组（代表）
  {
    id: 36,
    name_en: 'Ace of Cups',
    name_zh: '圣杯王牌',
    suit: 'cups',
    number: 1,
    keywords: ['爱', '情感', '直觉', '新关系'],
    upright: '新的情感开始，爱与喜悦的到来。敞开心扉接受爱。',
    reversed: '情感封闭、失望、情绪压抑。需要疗愈内心。'
  },
  // 宝剑牌组（代表）
  {
    id: 50,
    name_en: 'Ace of Swords',
    name_zh: '宝剑王牌',
    suit: 'swords',
    number: 1,
    keywords: ['真相', '清晰', '突破', '决断'],
    upright: '真相大白、思路清晰、突破性的想法。用理性做决定。',
    reversed: '混乱、误解、缺乏清晰度。需要更多信息。'
  },
  // 星币牌组（代表）
  {
    id: 64,
    name_en: 'Ace of Pentacles',
    name_zh: '星币王牌',
    suit: 'pentacles',
    number: 1,
    keywords: ['机会', '繁荣', '物质', '新开始'],
    upright: '新的财务机会、物质上的开始。脚踏实地，稳步前进。',
    reversed: '错失机会、财务不稳、缺乏规划。需要更务实。'
  },
];

// 获取随机塔罗牌
export function drawRandomCards(count: number): Array<TarotCard & { orientation: 'upright' | 'reversed' }> {
  const shuffled = [...majorArcana].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(card => ({
    ...card,
    orientation: Math.random() > 0.5 ? 'upright' : 'reversed'
  }));
}
