export interface Card {
  month: number;
  type: 'bright' | 'animal' | 'ribbon' | 'junk';
  name: string;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  money: number;
  bet: number;
  isAI: boolean;
  action?: 'call' | 'raise' | 'die' | 'half' | 'allin' | null;
  folded: boolean;
}

export interface GameState {
  players: Player[];
  currentPlayer: number;
  phase: 'dealing' | 'betting' | 'reveal' | 'result';
  pot: number;
  round: number;
  winner: string | null;
  currentBet: number;
  bettingRound: number;
  lastRaisePlayer: number | null;
}

export interface HandResult {
  type: 'ddang' | 'ggut' | 'special';
  value: number;
  name: string;
  rank: number;
}