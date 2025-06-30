const API_BASE_URL = 'http://localhost:8000/api';

export interface GameState {
  id: string;
  players: Player[];
  current_player: number;
  phase: string;
  pot: number;
  round: number;
  winner: string | null;
  current_bet: number;
  betting_round: number;
  last_raise_player: number | null;
}

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  money: number;
  bet: number;
  action: string | null;
  folded: boolean;
}

export interface Card {
  month: number;
  type: string;
  name: string;
  value: number;
}

export interface HandResult {
  type: string;
  value: number;
  name: string;
  rank: number;
}

class ApiService {
  async createGame(): Promise<{ game_id: string }> {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to create game');
    }
    
    return response.json();
  }

  async joinGame(gameId: string, playerName: string): Promise<{ player_id: string }> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/join?player_name=${encodeURIComponent(playerName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to join game');
    }
    
    return response.json();
  }

  async makeAction(gameId: string, playerId: string, action: string, amount?: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_id: gameId,
        player_id: playerId,
        action,
        amount,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to make action');
    }
    
    return response.json();
  }

  async revealCards(gameId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/reveal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to reveal cards');
    }
    
    return response.json();
  }

  async nextRound(gameId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/next-round`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to start next round');
    }
    
    return response.json();
  }

  async getGame(gameId: string): Promise<GameState> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get game state');
    }
    
    return response.json();
  }

  connectWebSocket(playerId: string, onMessage: (data: any) => void): WebSocket {
    const ws = new WebSocket(`ws://localhost:8000/ws/${playerId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return ws;
  }
}

export const apiService = new ApiService();