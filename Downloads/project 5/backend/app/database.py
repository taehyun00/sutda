import mysql.connector
from mysql.connector import Error
import os
import json
from typing import Optional, List, Dict

class Database:
    def __init__(self):
        self.connection = None
        self.host = os.getenv('DB_HOST', 'host.docker.internal')  # ✅ 기본값 수정
        self.database = os.getenv('DB_NAME', 'poker_db')
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASSWORD', '')  # ✅ 빈 문자열 허용
        self.port = int(os.getenv('DB_PORT', '3306'))
    
    async def connect(self):
        """데이터베이스 연결"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                database=self.database,
                user=self.user,
                password=self.password,
                port=self.port,
                autocommit=True
            )
            return True
        except Error as e:
            print(f"Database connection error: {e}")
            return False
    async def init_database(self):
        """데이터베이스 초기화"""
        try:
            connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                port=self.port,
                autocommit=True
            )
            cursor = connection.cursor()
            
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {self.database}")
            cursor.close()
            connection.close()
            
            await self.connect()
            
            if self.connection and self.connection.is_connected():
                cursor = self.connection.cursor()
                
                # 게임룸 테이블 (확장된 필드)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS game_rooms (
                        id VARCHAR(50) PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        description TEXT,
                        max_players INT DEFAULT 4,
                        current_players INT DEFAULT 0,
                        status VARCHAR(20) DEFAULT 'waiting',
                        current_pot INT DEFAULT 0,
                        current_bet INT DEFAULT 0,
                        is_private BOOLEAN DEFAULT FALSE,
                        password VARCHAR(100),
                        created_by VARCHAR(100),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                """)
                
                # 플레이어 테이블
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS players (
                        id VARCHAR(50) PRIMARY KEY,
                        room_id VARCHAR(50),
                        name VARCHAR(100),
                        chips INT DEFAULT 1000,
                        current_bet INT DEFAULT 0,
                        folded BOOLEAN DEFAULT FALSE,
                        cards JSON,
                        is_ready BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE
                    )
                """)
                
                # 게임 히스토리 테이블
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS game_history (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        room_id VARCHAR(50),
                        winner_id VARCHAR(50),
                        pot_amount INT,
                        game_data JSON,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                cursor.close()
                print("Database initialized successfully")
                
        except Error as e:
            print(f"Database initialization error: {e}")
    
    async def create_room(self, room_data: dict):
        """게임룸 생성"""
        if not self.connection or not self.connection.is_connected():
            await self.connect()
        
        cursor = self.connection.cursor()
        query = """
            INSERT INTO game_rooms (id, name, description, max_players, is_private, password, created_by) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            room_data['id'],
            room_data['name'],
            room_data.get('description', ''),
            room_data.get('max_players', 4),
            room_data.get('is_private', False),
            room_data.get('password'),
            room_data.get('created_by')
        ))
        cursor.close()
    
    async def get_all_rooms(self):
        """모든 게임룸 조회"""
        if not self.connection or not self.connection.is_connected():
            await self.connect()
        
        cursor = self.connection.cursor(dictionary=True)
        query = """
            SELECT r.*, 
                   COUNT(p.id) as current_players
            FROM game_rooms r
            LEFT JOIN players p ON r.id = p.room_id
            GROUP BY r.id
            ORDER BY r.created_at DESC
        """
        cursor.execute(query)
        rooms = cursor.fetchall()
        cursor.close()
        return rooms
    
    async def get_room_by_id(self, room_id: str):
        """특정 게임룸 조회"""
        if not self.connection or not self.connection.is_connected():
            await self.connect()
        
        cursor = self.connection.cursor(dictionary=True)
        query = """
            SELECT r.*, 
                   COUNT(p.id) as current_players
            FROM game_rooms r
            LEFT JOIN players p ON r.id = p.room_id
            WHERE r.id = %s
            GROUP BY r.id
        """
        cursor.execute(query, (room_id,))
        room = cursor.fetchone()
        cursor.close()
        return room
    
    async def update_room(self, room_id: str, room_data: dict):
        """게임룸 정보 수정"""
        if not self.connection or not self.connection.is_connected():
            await self.connect()
        
        cursor = self.connection.cursor()
        
        # 동적으로 업데이트할 필드 구성
        update_fields = []
        values = []
        
        if 'name' in room_data:
            update_fields.append("name = %s")
            values.append(room_data['name'])
        
        if 'description' in room_data:
            update_fields.append("description = %s")
            values.append(room_data['description'])
        
        if 'max_players' in room_data:
            update_fields.append("max_players = %s")
            values.append(room_data['max_players'])
        
        if 'is_private' in room_data:
            update_fields.append("is_private = %s")
            values.append(room_data['is_private'])
        
        if 'password' in room_data:
            update_fields.append("password = %s")
            values.append(room_data['password'])
        
        if update_fields:
            values.append(room_id)
            query = f"UPDATE game_rooms SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(query, values)
        
        cursor.close()
    
    async def delete_room(self, room_id: str):
        """게임룸 삭제"""
        if not self.connection or not self.connection.is_connected():
            await self.connect()
        
        cursor = self.connection.cursor()
        query = "DELETE FROM game_rooms WHERE id = %s"
        cursor.execute(query, (room_id,))
        cursor.close()
    
    async def add_player_to_room(self, room_id: str, player_id: str, player_name: str):
        """플레이어를 게임룸에 추가"""
        if not self.connection or not self.connection.is_connected():
            await self.connect()
        
        cursor = self.connection.cursor()
        
        # 플레이어 추가
        query = "INSERT INTO players (id, room_id, name) VALUES (%s, %s, %s)"
        cursor.execute(query, (player_id, room_id, player_name))
        
        # 방의 현재 플레이어 수 업데이트
        update_query = """
            UPDATE game_rooms 
            SET current_players = (SELECT COUNT(*) FROM players WHERE room_id = %s)
            WHERE id = %s
        """
        cursor.execute(update_query, (room_id, room_id))
        
        cursor.close()
    
    async def remove_player_from_room(self, room_id: str, player_id: str):
        """플레이어를 게임룸에서 제거"""
        if not self.connection or not self.connection.is_connected():
            await self.connect()
        
        cursor = self.connection.cursor()
        
        # 플레이어 제거
        query = "DELETE FROM players WHERE id = %s AND room_id = %s"
        cursor.execute(query, (player_id, room_id))
        
        # 방의 현재 플레이어 수 업데이트
        update_query = """
            UPDATE game_rooms 
            SET current_players = (SELECT COUNT(*) FROM players WHERE room_id = %s)
            WHERE id = %s
        """
        cursor.execute(update_query, (room_id, room_id))
        
        cursor.close()
    
    async def get_room_players(self, room_id: str):
        """방의 플레이어 목록 조회"""
        if not self.connection or not self.connection.is_connected():
            await self.connect()
        
        cursor = self.connection.cursor(dictionary=True)
        query = "SELECT * FROM players WHERE room_id = %s ORDER BY created_at"
        cursor.execute(query, (room_id,))
        players = cursor.fetchall()
        cursor.close()
        return players
    
    async def update_room_status(self, room_id: str, status: str):
        """방 상태 업데이트"""
        if not self.connection or not self.connection.is_connected():
            await self.connect()
        
        cursor = self.connection.cursor()
        query = "UPDATE game_rooms SET status = %s WHERE id = %s"
        cursor.execute(query, (status, room_id))
        cursor.close()
    
    async def save_game_state(self, room_id: str, game_data: dict):
        """게임 상태 저장"""
        if not self.connection or not self.connection.is_connected():
            await self.connect()
        
        cursor = self.connection.cursor()
        query = "UPDATE game_rooms SET status = %s, current_pot = %s, current_bet = %s WHERE id = %s"
        cursor.execute(query, (
            game_data.get('status'),
            game_data.get('current_pot'),
            game_data.get('current_bet'),
            room_id
        ))
        cursor.close()
    
    async def save_game_result(self, room_id: str, winner_id: str, pot_amount: int, game_data: dict):
        """게임 결과 저장"""
        if not self.connection or not self.connection.is_connected():
            await self.connect()
        
        cursor = self.connection.cursor()
        query = "INSERT INTO game_history (room_id, winner_id, pot_amount, game_data) VALUES (%s, %s, %s, %s)"
        cursor.execute(query, (room_id, winner_id, pot_amount, json.dumps(game_data)))
        cursor.close()
    
    async def close(self):
        """데이터베이스 연결 종료"""
        if self.connection and self.connection.is_connected():
            self.connection.close()