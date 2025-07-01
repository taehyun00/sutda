from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import asyncio
import uuid
from typing import Dict, List, Optional
import mysql.connector
from mysql.connector import Error
import os
from .database import Database
from .game_logic import SeotdaGame, Card
from .models import GameRoom, Player, BetAction

app = FastAPI(title="Seotda Game API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 연결
db = Database()

# 게임 관리
game_rooms: Dict[str, GameRoom] = {}
connections: Dict[str, WebSocket] = {}
room_list_connections: List[WebSocket] = []

# Pydantic 모델들
class CreateRoomRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    max_players: Optional[int] = 4
    is_private: Optional[bool] = False
    password: Optional[str] = None
    created_by: str

class UpdateRoomRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    max_players: Optional[int] = None
    is_private: Optional[bool] = None
    password: Optional[str] = None

class JoinRoomRequest(BaseModel):
    password: Optional[str] = None

@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 데이터베이스 초기화"""
    await db.init_database()

@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 시 정리"""
    await db.close()

@app.get("/")
async def root():
    return {"message": "섯다게임 API 서버"}

# 방 목록 조회
@app.get("/api/rooms")
async def get_rooms():
    """모든 게임룸 목록 조회"""
    try:
        rooms = await db.get_all_rooms()
        return {"rooms": rooms}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 방 생성
@app.post("/api/rooms")
async def create_room(room_request: CreateRoomRequest):
    """새 게임룸 생성"""
    try:
        room_id = str(uuid.uuid4())[:8]
        
        room_data = {
            "id": room_id,
            "name": room_request.name,
            "description": room_request.description,
            "max_players": room_request.max_players,
            "is_private": room_request.is_private,
            "password": room_request.password,
            "created_by": room_request.created_by
        }
        
        # 데이터베이스에 방 생성
        await db.create_room(room_data)
        
        # 메모리에 게임룸 객체 생성
        game_room = GameRoom(room_id=room_id)
        game_rooms[room_id] = game_room
        
        # 방 목록을 구독하는 모든 클라이언트에게 업데이트 전송
        await broadcast_room_list_update()
        
        return {"room_id": room_id, "message": "방이 생성되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 특정 방 조회
@app.get("/api/rooms/{room_id}")
async def get_room(room_id: str):
    """특정 게임룸 정보 조회"""
    try:
        room = await db.get_room_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="방을 찾을 수 없습니다.")
        
        players = await db.get_room_players(room_id)
        
        return {
            "room": room,
            "players": players
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# 방 정보 수정
@app.put("/api/rooms/{room_id}")
async def update_room(room_id: str, room_request: UpdateRoomRequest):
    """게임룸 정보 수정"""
    try:
        # 방 존재 확인
        room = await db.get_room_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="방을 찾을 수 없습니다.")
        
        # 게임 진행 중인지 확인
        if room['status'] == 'playing':
            raise HTTPException(status_code=400, detail="게임 진행 중에는 방 정보를 수정할 수 없습니다.")
        
        # 업데이트할 데이터 준비
        update_data = {}
        if room_request.name is not None:
            update_data['name'] = room_request.name
        if room_request.description is not None:
            update_data['description'] = room_request.description
        if room_request.max_players is not None:
            update_data['max_players'] = room_request.max_players
        if room_request.is_private is not None:
            update_data['is_private'] = room_request.is_private
        if room_request.password is not None:
            update_data['password'] = room_request.password
        
        # 데이터베이스 업데이트
        await db.update_room(room_id, update_data)
        
        # 방 목록 업데이트 브로드캐스트
        await broadcast_room_list_update()
        
        # 해당 방의 플레이어들에게 방 정보 업데이트 전송
        if room_id in game_rooms:
            await broadcast_game_state(room_id)
        
        return {"message": "방 정보가 수정되었습니다."}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# 방 삭제
@app.delete("/api/rooms/{room_id}")
async def delete_room(room_id: str):
    """게임룸 삭제"""
    try:
        # 방 존재 확인
        room = await db.get_room_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="방을 찾을 수 없습니다.")
        
        # 게임 진행 중인지 확인
        if room['status'] == 'playing':
            raise HTTPException(status_code=400, detail="게임 진행 중에는 방을 삭제할 수 없습니다.")
        
        # 방에 있는 모든 플레이어들에게 방 삭제 알림
        if room_id in game_rooms:
            game_room = game_rooms[room_id]
            for player in game_room.players:
                try:
                    await player.websocket.send_json({
                        "type": "room_deleted",
                        "message": "방이 삭제되었습니다."
                    })
                    await player.websocket.close()
                except:
                    pass
            
            # 메모리에서 게임룸 제거
            del game_rooms[room_id]
        
        # 데이터베이스에서 방 삭제 (CASCADE로 플레이어도 자동 삭제)
        await db.delete_room(room_id)
        
        # 방 목록 업데이트 브로드캐스트
        await broadcast_room_list_update()
        
        return {"message": "방이 삭제되었습니다."}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# 방 참가 (비밀번호 확인)
@app.post("/api/rooms/{room_id}/join")
async def join_room_check(room_id: str, join_request: JoinRoomRequest):
    """방 참가 전 비밀번호 확인"""
    try:
        room = await db.get_room_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="방을 찾을 수 없습니다.")
        
        # 방이 가득 찬지 확인
        if room['current_players'] >= room['max_players']:
            raise HTTPException(status_code=400, detail="방이 가득 찼습니다.")
        
        # 비밀방인 경우 비밀번호 확인
        if room['is_private']:
            if not join_request.password or join_request.password != room['password']:
                raise HTTPException(status_code=401, detail="비밀번호가 틀렸습니다.")
        
        return {"message": "방 참가가 가능합니다.", "room": room}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# 방 목록 실시간 구독
@app.websocket("/ws/rooms")
async def websocket_room_list(websocket: WebSocket):
    """방 목록 실시간 업데이트 WebSocket"""
    await websocket.accept()
    room_list_connections.append(websocket)
    
    try:
        # 초기 방 목록 전송
        rooms = await db.get_all_rooms()
        await websocket.send_json({
            "type": "room_list",
            "rooms": rooms
        })
        
        # 연결 유지
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        room_list_connections.remove(websocket)

# 게임룸 WebSocket
@app.websocket("/ws/{room_id}/{player_name}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, player_name: str):
    """게임룸 WebSocket 연결 처리"""
    await websocket.accept()
    
    player_id = str(uuid.uuid4())[:8]
    connections[player_id] = websocket
    
    try:
        # 방 존재 확인
        room_data = await db.get_room_by_id(room_id)
        if not room_data:
            await websocket.send_json({"type": "error", "message": "방을 찾을 수 없습니다."})
            return
        
        # 방이 가득 찬지 확인
        if room_data['current_players'] >= room_data['max_players']:
            await websocket.send_json({"type": "error", "message": "방이 가득 찼습니다."})
            return
        
        # 플레이어를 게임룸에 추가
        if room_id not in game_rooms:
            game_rooms[room_id] = GameRoom(room_id=room_id)
        
        room = game_rooms[room_id]
        player = Player(id=player_id, name=player_name, websocket=websocket)
        
        room.add_player(player)
        await db.add_player_to_room(room_id, player_id, player_name)
        
        # 방 목록 업데이트 (플레이어 수 변경)
        await broadcast_room_list_update()
        
        # 모든 플레이어에게 게임 상태 전송
        await broadcast_game_state(room_id)
        
        # 메시지 처리 루프
        while True:
            data = await websocket.receive_json()
            await handle_message(room_id, player_id, data)
            
    except WebSocketDisconnect:
        # 플레이어 연결 해제
        if room_id in game_rooms:
            room = game_rooms[room_id]
            room.remove_player(player_id)
            await db.remove_player_from_room(room_id, player_id)
            
            # 방에 플레이어가 없으면 방 삭제
            if not room.players:
                await db.delete_room(room_id)
                del game_rooms[room_id]
            
            await broadcast_game_state(room_id)
            await broadcast_room_list_update()
        
        if player_id in connections:
            del connections[player_id]

async def broadcast_room_list_update():
    """방 목록 업데이트를 모든 구독자에게 브로드캐스트"""
    if not room_list_connections:
        return
    
    try:
        rooms = await db.get_all_rooms()
        message = {
            "type": "room_list",
            "rooms": rooms
        }
        
        # 연결이 끊어진 WebSocket 제거
        disconnected = []
        for websocket in room_list_connections:
            try:
                await websocket.send_json(message)
            except:
                disconnected.append(websocket)
        
        for ws in disconnected:
            room_list_connections.remove(ws)
            
    except Exception as e:
        print(f"방 목록 브로드캐스트 에러: {e}")

async def handle_message(room_id: str, player_id: str, data: dict):
    """WebSocket 메시지 처리"""
    room = game_rooms.get(room_id)
    if not room:
        return
    
    message_type = data.get("type")
    
    if message_type == "start_game":
        if len(room.players) >= 2:
            await start_game(room_id)
    
    elif message_type == "bet":
        action = data.get("action")
        amount = data.get("amount", 0)
        await handle_bet(room_id, player_id, action, amount)
    
    elif message_type == "ready":
        room.set_player_ready(player_id)
        await broadcast_game_state(room_id)

async def start_game(room_id: str):
    """게임 시작"""
    room = game_rooms[room_id]
    room.start_game()
    
    # 방 상태를 'playing'으로 업데이트
    await db.update_room_status(room_id, 'playing')
    
    # 카드 배분
    seotda_game = SeotdaGame()
    for player in room.players:
        cards = seotda_game.deal_cards()
        player.cards = cards
        await player.websocket.send_json({
            "type": "cards_dealt",
            "cards": [{"suit": c.suit, "number": c.number} for c in cards]
        })
    
    # 게임 상태를 데이터베이스에 저장
    await db.save_game_state(room_id, room.to_dict())
    
    # 방 목록 업데이트 (상태 변경)
    await broadcast_room_list_update()
    
    await broadcast_game_state(room_id)

async def handle_bet(room_id: str, player_id: str, action: str, amount: int):
    """베팅 처리"""
    room = game_rooms[room_id]
    player = room.get_player(player_id)
    
    if not player or room.current_player != player_id:
        return
    
    bet_action = BetAction(player_id=player_id, action=action, amount=amount)
    
    if action == "call":
        bet_amount = room.current_bet - player.current_bet
        if player.chips >= bet_amount:
            player.chips -= bet_amount
            player.current_bet = room.current_bet
            room.current_pot += bet_amount
    
    elif action == "raise":
        total_bet = room.current_bet + amount
        bet_amount = total_bet - player.current_bet
        if player.chips >= bet_amount:
            player.chips -= bet_amount
            player.current_bet = total_bet
            room.current_bet = total_bet
            room.current_pot += bet_amount
    
    elif action == "fold":
        player.folded = True
    
    elif action == "all_in":
        bet_amount = player.chips
        player.current_bet += bet_amount
        room.current_pot += bet_amount
        player.chips = 0
        if player.current_bet > room.current_bet:
            room.current_bet = player.current_bet
    
    elif action == "half":
        bet_amount = room.current_pot // 2
        if player.chips >= bet_amount:
            player.chips -= bet_amount
            player.current_bet += bet_amount
            room.current_pot += bet_amount
            if player.current_bet > room.current_bet:
                room.current_bet = player.current_bet
    
    # 다음 플레이어로 턴 넘기기
    room.next_turn()
    
    # 베팅 라운드 완료 확인
    if room.is_betting_complete():
        await end_game(room_id)
    else:
        await broadcast_game_state(room_id)

async def end_game(room_id: str):
    """게임 종료 및 승부 결정"""
    room = game_rooms[room_id]
    active_players = [p for p in room.players if not p.folded]
    
    if len(active_players) == 1:
        # 한 명만 남은 경우
        winner = active_players[0]
    else:
        # 카드 비교
        seotda_game = SeotdaGame()
        winner = seotda_game.determine_winner(active_players)
    
    # 승자에게 팟 지급
    winner.chips += room.current_pot
    
    # 게임 결과 전송
    await broadcast_game_result(room_id, winner)
    
    # 게임 상태 초기화
    room.reset_game()
    
    # 방 상태를 'waiting'으로 업데이트
    await db.update_room_status(room_id, 'waiting')
    
    # 방 목록 업데이트
    await broadcast_room_list_update()

async def broadcast_game_state(room_id: str):
    """모든 플레이어에게 게임 상태 전송"""
    room = game_rooms.get(room_id)
    if not room:
        return
    
    game_state = {
        "type": "game_state",
        "players": [
            {
                "id": p.id,
                "name": p.name,
                "chips": p.chips,
                "current_bet": p.current_bet,
                "folded": p.folded,
                "ready": p.ready
            } for p in room.players
        ],
        "current_pot": room.current_pot,
        "current_bet": room.current_bet,
        "current_player": room.current_player,
        "status": room.status
    }
    
    for player in room.players:
        try:
            await player.websocket.send_json(game_state)
        except:
            pass

async def broadcast_game_result(room_id: str, winner: Player):
    """게임 결과 전송"""
    room = game_rooms[room_id]
    
    result = {
        "type": "game_result",
        "winner": {
            "id": winner.id,
            "name": winner.name,
            "cards": [{"suit": c.suit, "number": c.number} for c in winner.cards] if winner.cards else []
        },
        "all_players": [
            {
                "id": p.id,
                "name": p.name,
                "cards": [{"suit": c.suit, "number": c.number} for c in p.cards] if p.cards else [],
                "folded": p.folded
            } for p in room.players
        ]
    }
    
    for player in room.players:
        try:
            await player.websocket.send_json(result)
        except:
            pass