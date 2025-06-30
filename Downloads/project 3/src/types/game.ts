export interface Card {
  month: number;
  type: 'bright' | 'animal' | 'ribbon' | 'junk';
  name: string;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  chips: number;
  currentBet: number;
  cards: Card[];
  handValue: number;
  handName: string;
  status: 'waiting' | 'playing' | 'folded' | 'all-in';
  isReady: boolean;
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayer: number;
  phase: 'waiting' | 'betting' | 'reveal' | 'finished';
  pot: number;
  minBet: number;
  maxBet: number;
  round: number;
  winner?: string;
}

export interface BetAction {
  type: 'call' | 'fold' | 'half' | 'all-in' | 'raise';
  amount?: number;
}

export interface GameMessage {
  type: 'game_state' | 'player_joined' | 'player_left' | 'bet_made' | 'game_over' | 'error';
  data: any;
}