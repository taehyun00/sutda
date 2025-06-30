import React, { useState } from 'react';
import { Users, Plus, LogIn, Gamepad2 } from 'lucide-react';

interface LobbyProps {
  onJoinRoom: (roomId: string, playerName: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoinRoom }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert('플레이어 이름을 입력해주세요.');
      return;
    }
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    onJoinRoom(newRoomId, playerName.trim());
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      alert('플레이어 이름을 입력해주세요.');
      return;
    }
    if (!roomId.trim()) {
      alert('방 ID를 입력해주세요.');
      return;
    }
    onJoinRoom(roomId.trim().toUpperCase(), playerName.trim());
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              플레이어 이름
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              maxLength={12}
            />
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCreateRoom}
              disabled={!playerName.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>새 방 만들기</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="방 ID 입력 (예: ABC123)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all mb-3"
                maxLength={6}
              />
              <button
                onClick={handleJoinRoom}
                disabled={!playerName.trim() || !roomId.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <LogIn className="w-5 h-5" />
                <span>방 참가하기</span>
              </button>
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