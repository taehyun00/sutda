import { Card } from '../types/game';

export const SEOTTA_CARDS: Card[] = [
  // 1월 (소나무) - Pine
  { month: 1, type: 'bright', name: '송학', value: 20 },
  { month: 1, type: 'ribbon', name: '송패', value: 5 },
  { month: 1, type: 'junk', name: '송끌', value: 1 },

  // 2월 (매화) - Plum
  { month: 2, type: 'animal', name: '매조', value: 10 },
  { month: 2, type: 'ribbon', name: '매패', value: 5 },
  { month: 2, type: 'junk', name: '매끌', value: 1 },

  // 3월 (벚꽃) - Cherry
  { month: 3, type: 'bright', name: '벚광', value: 20 },
  { month: 3, type: 'ribbon', name: '벚패', value: 5 },
  { month: 3, type: 'junk', name: '벚끌', value: 1 },

  // 4월 (등나무) - Wisteria  
  { month: 4, type: 'animal', name: '등새', value: 10 },
  { month: 4, type: 'ribbon', name: '등패', value: 5 },
  { month: 4, type: 'junk', name: '등끌', value: 1 },

  // 5월 (창포) - Iris
  { month: 5, type: 'animal', name: '창다리', value: 10 },
  { month: 5, type: 'ribbon', name: '창패', value: 5 },
  { month: 5, type: 'junk', name: '창끌', value: 1 },

  // 6월 (모란) - Peony
  { month: 6, type: 'animal', name: '모란나비', value: 10 },
  { month: 6, type: 'ribbon', name: '모란패', value: 5 },
  { month: 6, type: 'junk', name: '모란끌', value: 1 },

  // 7월 (싸리) - Bush clover
  { month: 7, type: 'animal', name: '싸리멧돼지', value: 10 },
  { month: 7, type: 'ribbon', name: '싸리패', value: 5 },
  { month: 7, type: 'junk', name: '싸리끌', value: 1 },

  // 8월 (억새) - Pampas grass
  { month: 8, type: 'bright', name: '억새달', value: 20 },
  { month: 8, type: 'animal', name: '억새기러기', value: 10 },
  { month: 8, type: 'junk', name: '억새끌', value: 1 },

  // 9월 (국화) - Chrysanthemum
  { month: 9, type: 'animal', name: '국화술잔', value: 10 },
  { month: 9, type: 'ribbon', name: '국화패', value: 5 },
  { month: 9, type: 'junk', name: '국화끌', value: 1 },

  // 10월 (단풍) - Maple
  { month: 10, type: 'animal', name: '단풍사슴', value: 10 },
  { month: 10, type: 'ribbon', name: '단풍패', value: 5 },
  { month: 10, type: 'junk', name: '단풍끌', value: 1 },

  // 11월 (오동) - Paulownia
  { month: 11, type: 'bright', name: '오동광', value: 20 },
  { month: 11, type: 'junk', name: '오동끌1', value: 1 },
  { month: 11, type: 'junk', name: '오동끌2', value: 1 },

  // 12월 (비) - Rain
  { month: 12, type: 'bright', name: '비광', value: 20 },
  { month: 12, type: 'animal', name: '비제비', value: 10 },
  { month: 12, type: 'junk', name: '비끌', value: 1 }
];

export function calculateHandValue(cards: Card[]): { value: number; name: string } {
  if (cards.length !== 2) return { value: 0, name: '없음' };

  const [card1, card2] = cards;
  
  // 특수 패 조합들
  if (card1.month === 1 && card2.month === 2) return { value: 100, name: '12땡' };
  if (card1.month === 1 && card2.month === 4) return { value: 99, name: '14땡' };
  if (card1.month === 1 && card2.month === 9) return { value: 98, name: '19땡' };
  if (card1.month === 1 && card2.month === 10) return { value: 97, name: '110땡' };
  if (card1.month === 4 && card2.month === 10) return { value: 96, name: '410땡' };
  if (card1.month === 4 && card2.month === 6) return { value: 95, name: '46땡' };

  // 같은 달 (땡)
  if (card1.month === card2.month) {
    return { value: 90 + card1.month, name: `${card1.month}땡` };
  }

  // 끗수 계산
  const sum = (card1.month + card2.month) % 10;
  let name = '';
  
  if (sum === 0) name = '망통';
  else if (sum === 1) name = '1끗';
  else if (sum === 2) name = '2끗';
  else if (sum === 3) name = '3끗';
  else if (sum === 4) name = '4끗';
  else if (sum === 5) name = '5끗';
  else if (sum === 6) name = '6끗';
  else if (sum === 7) name = '7끗';
  else if (sum === 8) name = '8끗';
  else if (sum === 9) name = '9끗';

  return { value: sum, name };
}

export function shuffleDeck(): Card[] {
  const deck = [...SEOTTA_CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}