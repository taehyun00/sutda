from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI()

# CORS 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "rooms.db"

# DB 초기화
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Pydantic 모델
class RoomCreate(BaseModel):
    name: str

class RoomUpdate(BaseModel):
    id: int
    name: str

# ✅ 방 전체 조회
@app.get("/api/rooms/list")
def get_rooms():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM rooms")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": row[0], "name": row[1]} for row in rows]

# ✅ 방 생성
@app.post("/api/rooms/create")
def create_room(room: RoomCreate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO rooms (name) VALUES (?)", (room.name,))
    conn.commit()
    conn.close()
    return {"message": "Room created successfully"}

# ✅ 방 수정
@app.put("/api/rooms/update")
def update_room(room: RoomUpdate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE rooms SET name = ? WHERE id = ?", (room.name, room.id))
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    conn.commit()
    conn.close()
    return {"message": "Room updated successfully"}

# ✅ 방 삭제
@app.delete("/api/rooms/delete/{room_id}")
def delete_room(room_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM rooms WHERE id = ?", (room_id,))
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    conn.commit()
    conn.close()
    return {"message": "Room deleted successfully"}


class StartGameRequest(BaseModel):
    room_id: int

@app.post("/api/sutda/start")
def start_game(data: StartGameRequest):
    import random
    cards = [f"{n}광" if i % 10 == 0 else str(n) for i, n in enumerate(random.sample(range(1, 21), 2))]
    return {
        "room_id": data.room_id,
        "cards": cards
    }