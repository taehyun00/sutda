import React, { useState, useEffect } from 'react';
import { Users, Plus, Gamepad2 } from 'lucide-react';

interface LobbyProps {
  onJoinRoom: (roomId: string, playerName: string) => void;
}

interface Room {
  room_id: string;
  players: string[];
}

const Lobby: React.FC<LobbyProps> = ({ onJoinRoom }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomList, setRoomList] = useState<Room[]>([]);

  const API_BASE = 'https://port-0-studa-backend-m19egg9z76496dc6.sel4.cloudtype.app';

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_BASE}/rooms`);
        if (!res.ok) throw new Error('Failed to fetch rooms');
        const data: Room[] = await res.json();
        setRoomList(data);
      } catch (err) {
        console.error("방 목록 불러오기 실패:", err);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      alert('플레이어 이름을 입력해주세요.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: playerName.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.room_id) {
        onJoinRoom(data.room_id, playerName.trim());
      } else {
        alert(data.detail || '방 생성 실패');
      }
    } catch (error) {
      console.error(error);
      alert('서버와 연결할 수 없습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-black flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">섯다 게임</h1>
          <p className="text-gray-600">전통 한국 카드 게임을 온라인으로 즐겨보세요</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">플레이어 이름</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              maxLength={12}
            />
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={!playerName.trim()}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>새 방 만들기</span>
          </button>

          <div className="pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">방 목록</h2>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {roomList.length === 0 ? (
                <p className="text-sm text-gray-500">현재 참가 가능한 방이 없습니다.</p>
              ) : (
                roomList.map((room) => (
                  <button
                    key={room.room_id}
                    onClick={() => onJoinRoom(room.room_id, playerName.trim())}
                    disabled={!playerName.trim() || room.players.length >= 2}
                    className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg flex justify-between items-center"
                  >
                    <span>방 ID: {room.room_id}</span>
                    <span>{room.players.length}/2명</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center justify-center space-x-2">
              <Users className="w-4 h-4" />
              <span>게임 규칙</span>
            </h3>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>• 2명의 플레이어가 참여</li>
              <li>• 각자 2장의 카드를 받음</li>
              <li>• 베팅 후 카드를 공개</li>
              <li>• 높은 패가 승리</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
