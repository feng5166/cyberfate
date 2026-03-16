import majorArcanaData from './tarot-data.json';
import cupsData from './tarot-minor-cups.json';
import pentaclesData from './tarot-minor-pentacles.json';
import swordsData from './tarot-minor-swords.json';
import wandsData from './tarot-minor-wands.json';

export interface TarotCard {
  id: number;
  name_en: string;
  name_zh: string;
  filename: string;
  keywords: string[];
  upright: string;
  reversed: string;
  suit?: string;
}

// 合并所有牌
const allCards: TarotCard[] = [
  ...majorArcanaData.major_arcana.map(c => ({ ...c, suit: 'major' })),
  ...cupsData.cups.map(c => ({ ...c, suit: 'cups' })),
  ...pentaclesData.pentacles.map(c => ({ ...c, suit: 'pentacles' })),
  ...swordsData.swords.map(c => ({ ...c, suit: 'swords' })),
  ...wandsData.wands.map(c => ({ ...c, suit: 'wands' }))
];

export function drawRandomCards(count: number): Array<TarotCard & { orientation: 'upright' | 'reversed' }> {
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(card => ({
    ...card,
    orientation: Math.random() > 0.5 ? 'upright' : 'reversed'
  }));
}

export function getCardImageUrl(card: TarotCard): string {
  const suitFolder = card.suit === 'major' ? 'major' : card.suit;
  return `/images/tarot/cards/${suitFolder}/${card.filename}`;
}
