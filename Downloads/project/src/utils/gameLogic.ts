import { Card, HandResult } from '../types/game';

export function calculateHand(cards: Card[]): HandResult {
  if (cards.length !== 2) {
    throw new Error('Hand must contain exactly 2 cards');
  }

  const [card1, card2] = cards;
  const month1 = card1.month;
  const month2 = card2.month;

  // 특수 조합 체크
  const specialResult = checkSpecialCombination(month1, month2, card1, card2);
  if (specialResult) {
    return specialResult;
  }

  // 땡 (같은 달)
  if (month1 === month2) {
    return {
      type: 'ddang',
      value: month1,
      name: `${month1}땡`,
      rank: getRankForDdang(month1)
    };
  }

  // 끝수
  const sum = month1 + month2;
  const ggut = sum % 10;
  
  return {
    type: 'ggut',
    value: ggut,
    name: `${ggut}끝`,
    rank: getRankForGgut(ggut)
  };
}

function checkSpecialCombination(month1: number, month2: number, card1: Card, card2: Card): HandResult | null {
  const months = [month1, month2].sort();
  
  // 38광땡 (최고)
  if ((month1 === 3 && month2 === 8) || (month1 === 8 && month2 === 3)) {
    if ((card1.type === 'bright' && month1 === 3) || (card2.type === 'bright' && month2 === 3) ||
        (card1.type === 'bright' && month1 === 8) || (card2.type === 'bright' && month2 === 8)) {
      return {
        type: 'special',
        value: 100,
        name: '38광땡',
        rank: 1000
      };
    }
  }

  // 13광땡
  if ((month1 === 1 && month2 === 3) || (month1 === 3 && month2 === 1)) {
    if ((card1.type === 'bright' && (month1 === 1 || month1 === 3)) || 
        (card2.type === 'bright' && (month2 === 1 || month2 === 3))) {
      return {
        type: 'special',
        value: 99,
        name: '13광땡',
        rank: 999
      };
    }
  }

  // 18광땡
  if ((month1 === 1 && month2 === 8) || (month1 === 8 && month2 === 1)) {
    if ((card1.type === 'bright' && (month1 === 1 || month1 === 8)) || 
        (card2.type === 'bright' && (month2 === 1 || month2 === 8))) {
      return {
        type: 'special',
        value: 98,
        name: '18광땡',
        rank: 998
      };
    }
  }

  // 특수 끝수 조합
  if (months[0] === 1 && months[1] === 3) {
    return {
      type: 'special',
      value: 95,
      name: '일삼',
      rank: 900
    };
  }

  if (months[0] === 1 && months[1] === 8) {
    return {
      type: 'special',
      value: 94,
      name: '일팔',
      rank: 899
    };
  }

  if (months[0] === 3 && months[1] === 8) {
    return {
      type: 'special',
      value: 93,
      name: '삼팔',
      rank: 898
    };
  }

  return null;
}

function getRankForDdang(month: number): number {
  switch (month) {
    case 10: return 800; // 장땡
    case 9: return 790;
    case 8: return 780;
    case 7: return 770;
    case 6: return 760;
    case 5: return 750;
    case 4: return 740;
    case 3: return 730;
    case 2: return 720;
    case 1: return 710;
    default: return 700;
  }
}

function getRankForGgut(ggut: number): number {
  return 600 + ggut * 10;
}

export function compareHands(hand1: HandResult, hand2: HandResult): number {
  return hand2.rank - hand1.rank;
}

export function getWinner(hands: HandResult[]): number[] {
  const maxRank = Math.max(...hands.map(hand => hand.rank));
  return hands.map((hand, index) => hand.rank === maxRank ? index : -1).filter(index => index !== -1);
}