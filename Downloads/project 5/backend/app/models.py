from typing import List, Optional, Dict
from fastapi import WebSocket
from pydantic import BaseModel
from dataclasses import dataclass

@dataclass
class Card:
    suit: str  # 화투 무늬
    number: int  # 1-10

class Player:
    def __init__(self, id: str, name: str, websocket: WebSocket):
        self.id = id
        self.name = name
        self.websocket = websocket
        self.chips = 1000
        self.current_bet = 0
        self.cards: List[Card] = []
        self.folded = False
        self.ready = False
    
    def reset_for_new_game(self):
        """새 게임을 위한 초기화"""
        self.current_bet = 0
        self.cards = []
        self.folded = False
        self.ready = False

class GameRoom:
    def __init__(self, room_id: str):
        self.room_id = room_id
        self.players: List[Player] = []
        self.status = "waiting"  # waiting, playing, finished
        self.current_pot = 0
        self.current_bet = 0
        self.current_player = None
        self.player_turn_index = 0
        self.betting_round = 0
    
    def add_player(self, player: Player):
        """플레이어 추가"""
        if len(self.players) < 4:
            self.players.append(player)
    
    def remove_player(self, player_id: str):
        """플레이어 제거"""
        self.players = [p for p in self.players if p.id != player_id]
        if not self.players:
            self.status = "finished"
    
    def get_player(self, player_id: str) -> Optional[Player]:
        """플레이어 찾기"""
        for player in self.players:
            if player.id == player_id:
                return player
        return None
    
    def start_game(self):
        """게임 시작"""
        if len(self.players) >= 2:
            self.status = "playing"
            self.current_player = self.players[0].id
            self.player_turn_index = 0
            self.current_bet = 10  # 기본 베팅 금액
            
            # 모든 플레이어 초기화
            for player in self.players:
                player.reset_for_new_game()
    
    def next_turn(self):
        """다음 플레이어 턴"""
        active_players = [p for p in self.players if not p.folded]
        if len(active_players) <= 1:
            return
        
        current_index = None
        for i, player in enumerate(active_players):
            if player.id == self.current_player:
                current_index = i
                break
        
        if current_index is not None:
            next_index = (current_index + 1) % len(active_players)
            self.current_player = active_players[next_index].id
    
    def is_betting_complete(self) -> bool:
        """베팅 라운드 완료 확인"""
        active_players = [p for p in self.players if not p.folded]
        
        if len(active_players) <= 1:
            return True
        
        # 모든 활성 플레이어가 같은 금액을 베팅했는지 확인
        betting_amounts = [p.current_bet for p in active_players]
        return len(set(betting_amounts)) == 1 and all(amount > 0 for amount in betting_amounts)
    
    def reset_game(self):
        """게임 초기화"""
        self.status = "waiting"
        self.current_pot = 0
        self.current_bet = 0
        self.current_player = None
        self.player_turn_index = 0
        self.betting_round = 0
        
        for player in self.players:
            player.reset_for_new_game()
    
    def set_player_ready(self, player_id: str):
        """플레이어 준비 상태 설정"""
        player = self.get_player(player_id)
        if player:
            player.ready = True
    
    def to_dict(self) -> Dict:
        """딕셔너리로 변환"""
        return {
            "room_id": self.room_id,
            "status": self.status,
            "current_pot": self.current_pot,
            "current_bet": self.current_bet,
            "current_player": self.current_player,
            "players": [
                {
                    "id": p.id,
                    "name": p.name,
                    "chips": p.chips,
                    "current_bet": p.current_bet,
                    "folded": p.folded
                } for p in self.players
            ]
        }

class BetAction(BaseModel):
    player_id: str
    action: str  # call, raise, fold, all_in, half
    amount: int = 0