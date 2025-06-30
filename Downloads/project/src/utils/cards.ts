import { Card } from '../types/game';

export const HWATU_CARDS: Card[] = [
  // 1월 (소나무)
  { month: 1, type: 'bright', name: '송학', value: 20 },
  { month: 1, type: 'ribbon', name: '적단', value: 5 },
  { month: 1, type: 'junk', name: '소나무', value: 1 },
  { month: 1, type: 'junk', name: '소나무', value: 1 },

  // 2월 (매화)
  { month: 2, type: 'animal', name: '매조', value: 10 },
  { month: 2, type: 'ribbon', name: '적단', value: 5 },
  { month: 2, type: 'junk', name: '매화', value: 2 },
  { month: 2, type: 'junk', name: '매화', value: 2 },

  // 3월 (벚꽃)
  { month: 3, type: 'bright', name: '벚꽃', value: 20 },
  { month: 3, type: 'ribbon', name: '적단', value: 5 },
  { month: 3, type: 'junk', name: '벚꽃', value: 3 },
  { month: 3, type: 'junk', name: '벚꽃', value: 3 },

  // 4월 (등나무)
  { month: 4, type: 'animal', name: '두견', value: 10 },
  { month: 4, type: 'ribbon', name: '흑단', value: 5 },
  { month: 4, type: 'junk', name: '등나무', value: 4 },
  { month: 4, type: 'junk', name: '등나무', value: 4 },

  // 5월 (창포)
  { month: 5, type: 'animal', name: '다리', value: 10 },
  { month: 5, type: 'ribbon', name: '흑단', value: 5 },
  { month: 5, type: 'junk', name: '창포', value: 5 },
  { month: 5, type: 'junk', name: '창포', value: 5 },

  // 6월 (모란)
  { month: 6, type: 'animal', name: '나비', value: 10 },
  { month: 6, type: 'ribbon', name: '청단', value: 5 },
  { month: 6, type: 'junk', name: '모란', value: 6 },
  { month: 6, type: 'junk', name: '모란', value: 6 },

  // 7월 (싸리)
  { month: 7, type: 'animal', name: '멧돼지', value: 10 },
  { month: 7, type: 'ribbon', name: '흑단', value: 5 },
  { month: 7, type: 'junk', name: '싸리', value: 7 },
  { month: 7, type: 'junk', name: '싸리', value: 7 },

  // 8월 (갈대)
  { month: 8, type: 'bright', name: '갈대광', value: 20 },
  { month: 8, type: 'animal', name: '기러기', value: 10 },
  { month: 8, type: 'junk', name: '갈대', value: 8 },
  { month: 8, type: 'junk', name: '갈대', value: 8 },

  // 9월 (국화)
  { month: 9, type: 'animal', name: '술잔', value: 10 },
  { month: 9, type: 'ribbon', name: '청단', value: 5 },
  { month: 9, type: 'junk', name: '국화', value: 9 },
  { month: 9, type: 'junk', name: '국화', value: 9 },

  // 10월 (단풍)
  { month: 10, type: 'animal', name: '사슴', value: 10 },
  { month: 10, type: 'ribbon', name: '청단', value: 5 },
  { month: 10, type: 'junk', name: '단풍', value: 10 },
  { month: 10, type: 'junk', name: '단풍', value: 10 },

  // 11월 (오동)
  { month: 11, type: 'bright', name: '오동광', value: 20 },
  { month: 11, type: 'junk', name: '오동', value: 1 },
  { month: 11, type: 'junk', name: '오동', value: 1 },
  { month: 11, type: 'junk', name: '비', value: 1 },

  // 12월 (비)
  { month: 12, type: 'bright', name: '우광', value: 20 },
  { month: 12, type: 'animal', name: '제비', value: 10 },
  { month: 12, type: 'ribbon', name: '흑단', value: 5 },
  { month: 12, type: 'junk', name: '비', value: 2 }
];

export function shuffleCards(): Card[] {
  const cards = [...HWATU_CARDS];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function dealCards(shuffledCards: Card[], playerCount: number): Card[][] {
  const hands: Card[][] = Array(playerCount).fill(null).map(() => []);
  
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < playerCount; j++) {
      hands[j].push(shuffledCards[i * playerCount + j]);
    }
  }
  
  return hands;
}