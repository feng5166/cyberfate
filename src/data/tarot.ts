import majorArcanaData from './tarot-data.json';
import cupsData from './tarot-minor-cups.json';
import pentaclesData from './tarot-minor-pentacles.json';
import swordsData from './tarot-minor-swords.json';
import wandsData from './tarot-minor-wands.json';

export interface TarotCard {
  id: number | string;
  name_en: string;
  name_zh: string;
  filename?: string;
  keywords: string[];
  upright: string;
  reversed: string;
  suit?: string;
}

type CardWithOrientation = TarotCard & { orientation: 'upright' | 'reversed' };

// 合并所有牌
const allCards: TarotCard[] = [
  ...majorArcanaData.major_arcana.map(c => ({ ...c, suit: 'major' })),
  ...cupsData.cups.map(c => ({ ...c, suit: 'cups' })),
  ...pentaclesData.pentacles.map(c => ({ ...c, suit: 'pentacles' })),
  ...swordsData.swords.map(c => ({ ...c, suit: 'swords' })),
  ...wandsData.wands.map(c => ({ ...c, suit: 'wands' }))
];

const majorArcanaCards: TarotCard[] = majorArcanaData.major_arcana.map(c => ({ ...c, suit: 'major' }));

function addOrientation(card: TarotCard): CardWithOrientation {
  return {
    ...card,
    // 正位 70%，逆位 30%
    orientation: Math.random() < 0.7 ? 'upright' : 'reversed'
  };
}

export function drawMajorArcana(count: number): CardWithOrientation[] {
  const shuffled = [...majorArcanaCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(addOrientation);
}

export function drawRandomCards(count: number): CardWithOrientation[] {
  // 当前约定：经典三张牌阵仅使用大阿卡纳。
  if (count === 3) {
    return drawMajorArcana(count);
  }

  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(addOrientation);
}

export function getCardImageUrl(card: TarotCard): string {
  const suitFolder = card.suit === 'major' ? 'major' : card.suit;
  const filename = card.filename || `${card.id}.jpg`;
  return `/images/tarot/cards/${suitFolder}/${filename}`;
}
