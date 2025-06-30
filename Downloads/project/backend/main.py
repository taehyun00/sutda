from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
import uuid
import random
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 게임 상태 저장
games: Dict[str, dict] = {}
connections: Dict[str, WebSocket] = {}

class Card(BaseModel):
    month: int
    type: str
    name: str
    value: int

class Player(BaseModel):
    id: str
    name: str
    cards: List[Card]
    money: int
    bet: int
    action: Optional[str] = None
    folded: bool = False

class GameState(BaseModel):
    id: str
    players: List[Player]
    current_player: int
    phase: str
    pot: int
    round: int
    winner: Optional[str] = None
    current_bet: int
    betting_round: int
    last_raise_player: Optional[int] = None

class GameAction(BaseModel):
    game_id: str
    player_id: str
    action: str
    amount: Optional[int] = None

# 화투 카드 데이터
HWATU_CARDS = [
    # 1월 (소나무)
    {"month": 1, "type": "bright", "name": "송학", "value": 20},
    {"month": 1, "type": "ribbon", "name": "적단", "value": 5},
    {"month": 1, "type": "junk", "name": "소나무", "value": 1},
    {"month": 1, "type": "junk", "name": "소나무", "value": 1},
    # 2월 (매화)
    {"month": 2, "type": "animal", "name": "매조", "value": 10},
    {"month": 2, "type": "ribbon", "name": "적단", "value": 5},
    {"month": 2, "type": "junk", "name": "매화", "value": 2},
    {"month": 2, "type": "junk", "name": "매화", "value": 2},
    # 3월 (벚꽃)
    {"month": 3, "type": "bright", "name": "벚꽃", "value": 20},
    {"month": 3, "type": "ribbon", "name": "적단", "value": 5},
    {"month": 3, "type": "junk", "name": "벚꽃", "value": 3},
    {"month": 3, "type": "junk", "name": "벚꽃", "value": 3},
    # 4월 (등나무)
    {"month": 4, "type": "animal", "name": "두견", "value": 10},
    {"month": 4, "type": "ribbon", "name": "흑단", "value": 5},
    {"month": 4, "type": "junk", "name": "등나무", "value": 4},
    {"month": 4, "type": "junk", "name": "등나무", "value": 4},
    # 5월 (창포)
    {"month": 5, "type": "animal", "name": "다리", "value": 10},
    {"month": 5, "type": "ribbon", "name": "흑단", "value": 5},
    {"month": 5, "type": "junk", "name": "창포", "value": 5},
    {"month": 5, "type": "junk", "name": "창포", "value": 5},
    # 6월 (모란)
    {"month": 6, "type": "animal", "name": "나비", "value": 10},
    {"month": 6, "type": "ribbon", "name": "청단", "value": 5},
    {"month": 6, "type": "junk", "name": "모란", "value": 6},
    {"month": 6, "type": "junk", "name": "모란", "value": 6},
    # 7월 (싸리)
    {"month": 7, "type": "animal", "name": "멧돼지", "value": 10},
    {"month": 7, "type": "ribbon", "name": "흑단", "value": 5},
    {"month": 7, "type": "junk", "name": "싸리", "value": 7},
    {"month": 7, "type": "junk", "name": "싸리", "value": 7},
    # 8월 (갈대)
    {"month": 8, "type": "bright", "name": "갈대광", "value": 20},
    {"month": 8, "type": "animal", "name": "기러기", "value": 10},
    {"month": 8, "type": "junk", "name": "갈대", "value": 8},
    {"month": 8, "type": "junk", "name": "갈대", "value": 8},
    # 9월 (국화)
    {"month": 9, "type": "animal", "name": "술잔", "value": 10},
    {"month": 9, "type": "ribbon", "name": "청단", "value": 5},
    {"month": 9, "type": "junk", "name": "국화", "value": 9},
    {"month": 9, "type": "junk", "name": "국화", "value": 9},
    # 10월 (단풍)
    {"month": 10, "type": "animal", "name": "사슴", "value": 10},
    {"month": 10, "type": "ribbon", "name": "청단", "value": 5},
    {"month": 10, "type": "junk", "name": "단풍", "value": 10},
    {"month": 10, "type": "junk", "name": "단풍", "value": 10},
    # 11월 (오동)
    {"month": 11, "type": "bright", "name": "오동광", "value": 20},
    {"month": 11, "type": "junk", "name": "오동", "value": 1},
    {"month": 11, "type": "junk", "name": "오동", "value": 1},
    {"month": 11, "type": "junk", "name": "비", "value": 1},
    # 12월 (비)
    {"month": 12, "type": "bright", "name": "우광", "value": 20},
    {"month": 12, "type": "animal", "name": "제비", "value": 10},
    {"month": 12, "type": "ribbon", "name": "흑단", "value": 5},
    {"month": 12, "type": "junk", "name": "비", "value": 2}
]

def shuffle_cards():
    cards = HWATU_CARDS.copy()
    random.shuffle(cards)
    return cards

def deal_cards(shuffled_cards, player_count):
    hands = [[] for _ in range(player_count)]
    for i in range(2):
        for j in range(player_count):
            hands[j].append(shuffled_cards[i * player_count + j])
    return hands

def calculate_hand(cards):
    if len(cards) != 2:
        raise ValueError("Hand must contain exactly 2 cards")
    
    card1, card2 = cards
    month1, month2 = card1["month"], card2["month"]
    
    # 특수 조합 체크
    special_result = check_special_combination(month1, month2, card1, card2)
    if special_result:
        return special_result
    
    # 땡 (같은 달)
    if month1 == month2:
        return {
            "type": "ddang",
            "value": month1,
            "name": f"{month1}땡",
            "rank": get_rank_for_ddang(month1)
        }
    
    # 끝수
    sum_months = month1 + month2
    ggut = sum_months % 10
    
    return {
        "type": "ggut",
        "value": ggut,
        "name": f"{ggut}끝",
        "rank": get_rank_for_ggut(ggut)
    }

def check_special_combination(month1, month2, card1, card2):
    months = sorted([month1, month2])
    
    # 38광땡 (최고)
    if (month1 == 3 and month2 == 8) or (month1 == 8 and month2 == 3):
        if ((card1["type"] == "bright" and month1 == 3) or 
            (card2["type"] == "bright" and month2 == 3) or
            (card1["type"] == "bright" and month1 == 8) or 
            (card2["type"] == "bright" and month2 == 8)):
            return {
                "type": "special",
                "value": 100,
                "name": "38광땡",
                "rank": 1000
            }
    
    # 13광땡
    if (month1 == 1 and month2 == 3) or (month1 == 3 and month2 == 1):
        if ((card1["type"] == "bright" and (month1 == 1 or month1 == 3)) or 
            (card2["type"] == "bright" and (month2 == 1 or month2 == 3))):
            return {
                "type": "special",
                "value": 99,
                "name": "13광땡",
                "rank": 999
            }
    
    # 18광땡
    if (month1 == 1 and month2 == 8) or (month1 == 8 and month2 == 1):
        if ((card1["type"] == "bright" and (month1 == 1 or month1 == 8)) or 
            (card2["type"] == "bright" and (month2 == 1 or month2 == 8))):
            return {
                "type": "special",
                "value": 98,
                "name": "18광땡",
                "rank": 998
            }
    
    # 특수 끝수 조합
    if months[0] == 1 and months[1] == 3:
        return {"type": "special", "value": 95, "name": "일삼", "rank": 900}
    if months[0] == 1 and months[1] == 8:
        return {"type": "special", "value": 94, "name": "일팔", "rank": 899}
    if months[0] == 3 and months[1] == 8:
        return {"type": "special", "value": 93, "name": "삼팔", "rank": 898}
    
    return None

def get_rank_for_ddang(month):
    ranks = {10: 800, 9: 790, 8: 780, 7: 770, 6: 760, 
             5: 750, 4: 740, 3: 730, 2: 720, 1: 710}
    return ranks.get(month, 700)

def get_rank_for_ggut(ggut):
    return 600 + ggut * 10

def get_winner(hands):
    max_rank = max(hand["rank"] for hand in hands)
    return [i for i, hand in enumerate(hands) if hand["rank"] == max_rank]

async def broadcast_game_state(game_id: str):
    """게임 상태를 모든 플레이어에게 브로드캐스트"""
    if game_id not in games:
        return
    
    game = games[game_id]
    for player in game["players"]:
        if player["id"] in connections:
            try:
                await connections[player["id"]].send_text(json.dumps({
                    "type": "game_state",
                    "data": game
                }))
            except:
                pass

@app.post("/api/games")
async def create_game():
    """새 게임 생성"""
    game_id = str(uuid.uuid4())
    game = {
        "id": game_id,
        "players": [],
        "current_player": 0,
        "phase": "waiting",
        "pot": 0,
        "round": 1,
        "winner": None,
        "current_bet": 0,
        "betting_round": 1,
        "last_raise_player": None,
        "created_at": datetime.now().isoformat()
    }
    games[game_id] = game
    return {"game_id": game_id}

@app.post("/api/games/{game_id}/join")
async def join_game(game_id: str, player_name: str):
    """게임 참가"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games[game_id]
    if len(game["players"]) >= 2:
        raise HTTPException(status_code=400, detail="Game is full")
    
    player_id = str(uuid.uuid4())
    player = {
        "id": player_id,
        "name": player_name,
        "cards": [],
        "money": 10000,
        "bet": 0,
        "action": None,
        "folded": False
    }
    
    game["players"].append(player)
    
    # 두 명이 모두 참가하면 게임 시작
    if len(game["players"]) == 2:
        start_new_round(game_id)
    
    await broadcast_game_state(game_id)
    return {"player_id": player_id}

def start_new_round(game_id: str):
    """새 라운드 시작"""
    if game_id not in games:
        return
    
    game = games[game_id]
    shuffled_cards = shuffle_cards()
    hands = deal_cards(shuffled_cards, 2)
    
    for i, player in enumerate(game["players"]):
        player["cards"] = hands[i]
        player["bet"] = 0
        player["action"] = None
        player["folded"] = False
    
    game["current_player"] = 0
    game["phase"] = "betting"
    game["pot"] = 0
    game["winner"] = None
    game["current_bet"] = 0
    game["betting_round"] = 1
    game["last_raise_player"] = None

@app.post("/api/games/{game_id}/action")
async def make_action(game_id: str, action_data: GameAction):
    """플레이어 액션 처리"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games[game_id]
    if game["phase"] != "betting":
        raise HTTPException(status_code=400, detail="Not in betting phase")
    
    # 현재 플레이어 확인
    current_player = game["players"][game["current_player"]]
    if current_player["id"] != action_data.player_id:
        raise HTTPException(status_code=400, detail="Not your turn")
    
    if current_player["folded"]:
        raise HTTPException(status_code=400, detail="Player already folded")
    
    # 액션 처리
    bet_amount = 0
    action_name = ""
    new_current_bet = game["current_bet"]
    
    if action_data.action == "call":
        bet_amount = game["current_bet"] - current_player["bet"]
        action_name = "체크" if game["current_bet"] == 0 else "콜"
    elif action_data.action == "raise":
        raise_amount = action_data.amount or 500
        bet_amount = (game["current_bet"] - current_player["bet"]) + raise_amount
        new_current_bet = current_player["bet"] + bet_amount
        action_name = f"{raise_amount}원 레이즈"
        game["last_raise_player"] = game["current_player"]
    elif action_data.action == "die":
        current_player["folded"] = True
        action_name = "다이"
    elif action_data.action == "half":
        half_amount = max(game["pot"] // 2, 500)
        bet_amount = (game["current_bet"] - current_player["bet"]) + half_amount
        new_current_bet = current_player["bet"] + bet_amount
        action_name = f"하프 ({half_amount}원)"
        game["last_raise_player"] = game["current_player"]
    elif action_data.action == "allin":
        bet_amount = current_player["money"]
        new_current_bet = current_player["bet"] + bet_amount
        action_name = f"올인 ({bet_amount}원)"
        game["last_raise_player"] = game["current_player"]
    
    # 돈 부족 체크
    if action_data.action != "die" and current_player["money"] < bet_amount:
        raise HTTPException(status_code=400, detail="Not enough money")
    
    # 액션 적용
    if action_data.action != "die":
        current_player["money"] -= bet_amount
        current_player["bet"] += bet_amount
        game["pot"] += bet_amount
    
    current_player["action"] = action_data.action
    game["current_bet"] = new_current_bet
    
    # 활성 플레이어 확인
    active_players = [p for p in game["players"] if not p["folded"]]
    
    # 한 명만 남은 경우
    if len(active_players) == 1:
        winner = active_players[0]
        winner["money"] += game["pot"]
        game["phase"] = "result"
        game["winner"] = winner["name"]
        game["pot"] = 0
    else:
        # 다음 플레이어로 전환
        next_player = (game["current_player"] + 1) % len(game["players"])
        while game["players"][next_player]["folded"]:
            next_player = (next_player + 1) % len(game["players"])
        
        game["current_player"] = next_player
        
        # 베팅 라운드 종료 체크
        all_matched = all(p["bet"] == new_current_bet or p["money"] == 0 for p in active_players)
        has_acted = all(p["action"] is not None for p in active_players)
        
        if all_matched and has_acted:
            game["phase"] = "reveal"
    
    await broadcast_game_state(game_id)
    return {"success": True, "action": action_name}

@app.post("/api/games/{game_id}/reveal")
async def reveal_cards(game_id: str):
    """카드 공개 및 승부 결정"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games[game_id]
    if game["phase"] != "reveal":
        raise HTTPException(status_code=400, detail="Not in reveal phase")
    
    active_players = [p for p in game["players"] if not p["folded"]]
    if len(active_players) <= 1:
        raise HTTPException(status_code=400, detail="Not enough active players")
    
    # 패 계산
    hands = []
    active_indices = []
    for i, player in enumerate(game["players"]):
        if not player["folded"]:
            hand_result = calculate_hand(player["cards"])
            hands.append(hand_result)
            active_indices.append(i)
    
    # 승자 결정
    winners = get_winner(hands)
    winner_indices = [active_indices[i] for i in winners]
    
    if len(winner_indices) == 1:
        winner = game["players"][winner_indices[0]]
        winner["money"] += game["pot"]
        game["winner"] = winner["name"]
    else:
        # 무승부
        pot_share = game["pot"] // len(winner_indices)
        for idx in winner_indices:
            game["players"][idx]["money"] += pot_share
        game["winner"] = "무승부"
    
    game["phase"] = "result"
    game["pot"] = 0
    
    await broadcast_game_state(game_id)
    return {"success": True, "winner": game["winner"]}

@app.post("/api/games/{game_id}/next-round")
async def next_round(game_id: str):
    """다음 라운드 시작"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games[game_id]
    if game["phase"] != "result":
        raise HTTPException(status_code=400, detail="Not in result phase")
    
    # 파산 체크
    bankrupt_players = [p for p in game["players"] if p["money"] <= 0]
    if bankrupt_players:
        game["phase"] = "finished"
        await broadcast_game_state(game_id)
        return {"success": True, "game_finished": True}
    
    game["round"] += 1
    start_new_round(game_id)
    
    await broadcast_game_state(game_id)
    return {"success": True}

@app.get("/api/games/{game_id}")
async def get_game(game_id: str):
    """게임 상태 조회"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return games[game_id]

@app.websocket("/ws/{player_id}")
async def websocket_endpoint(websocket: WebSocket, player_id: str):
    await websocket.accept()
    connections[player_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_text()
            # 클라이언트로부터 메시지 처리 (필요시)
    except WebSocketDisconnect:
        if player_id in connections:
            del connections[player_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)