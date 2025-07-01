import random
from typing import List, Optional
from .models import Player, Card

class SeotdaGame:
    """섯다게임 로직 클래스"""
    
    def __init__(self):
        self.deck = self.create_deck()
        self.shuffle_deck()
    
    def create_deck(self) -> List[Card]:
        """화투 덱 생성 (섯다용 20장)"""
        suits = ["pine", "plum", "cherry", "wisteria", "iris", "peony", "bush", "pampas", "chrysanthemum", "maple"]
        deck = []
        
        for suit in suits:
            deck.append(Card(suit=suit, number=1))
            deck.append(Card(suit=suit, number=2))
        
        return deck
    
    def shuffle_deck(self):
        """덱 섞기"""
        random.shuffle(self.deck)
    
    def deal_cards(self) -> List[Card]:
        """카드 2장 배분"""
        if len(self.deck) < 2:
            self.deck = self.create_deck()
            self.shuffle_deck()
        
        cards = [self.deck.pop(), self.deck.pop()]
        return cards
    
    def get_hand_value(self, cards: List[Card]) -> tuple:
        """섯다 패 점수 계산 (우선순위, 점수) - 장땡, 땡, 특수패, 끗순서"""
        if len(cards) != 2:
            return (0, 0)
        
        card1, card2 = cards
        numbers = sorted([card1.number, card2.number])
        
        # 장땡 (1-1, 2-2, ..., 10-10)
        if card1.number == card2.number:
            # 광땡: 3광(3), 7광(7), 8광(8) - 보통 3,7,8 숫자중에 광이면 광땡 처리
            # 여기서는 광카드 여부 없으니 일반 땡으로 처리
            # 실제로 3,7,8 숫자 광을 따로 관리하면 좋지만, 없으면 그냥 땡으로 간주
            # 장땡 우선순위는 10장땡 > 9장땡 > ... > 1장땡 순서
            # 우선순위 20부터 시작해서 숫자 높을수록 우선순위 높게
            priority = 20 + card1.number
            score = card1.number * 10
            return (priority, score)
        
        # 특수패 (알리, 독사, 구삥, 장삥, 장사, 세륙)
        if numbers == [1, 2]:
            return (18, 12)  # 알리 (1-2)
        elif numbers == [1, 4]:
            return (17, 14)  # 독사 (1-4)
        elif numbers == [1, 9]:
            return (16, 19)  # 구삥 (1-9)
        elif numbers == [1, 10]:
            return (15, 110)  # 장삥 (1-10)
        elif numbers == [4, 10]:
            return (14, 410)  # 장사 (4-10)
        elif numbers == [4, 6]:
            return (13, 46)  # 세륙 (4-6)
        
        # 끗수 계산 (총합 10으로 나눈 나머지)
        total = (card1.number + card2.number) % 10
        return (total, total)

    def get_hand_name(self, cards: List[Card]) -> str:
        """섯다 패 이름 반환"""
        if len(cards) != 2:
            return "Invalid"
        
        card1, card2 = cards
        numbers = sorted([card1.number, card2.number])
        
        # 장땡
        if card1.number == card2.number:
            return f"{card1.number}장땡"
        
        # 특수패
        if numbers == [1, 2]:
            return "알리"
        elif numbers == [1, 4]:
            return "독사"
        elif numbers == [1, 9]:
            return "구삥"
        elif numbers == [1, 10]:
            return "장삥"
        elif numbers == [4, 10]:
            return "장사"
        elif numbers == [4, 6]:
            return "세륙"
        
        # 끗수
        total = (card1.number + card2.number) % 10
        return f"{total}끗"
