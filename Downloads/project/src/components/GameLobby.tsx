import React, { useState } from 'react';
import { Users, Plus, LogIn } from 'lucide-react';

interface GameLobbyProps {
  onCreateGame: () => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  isLoading: boolean;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onCreateGame, onJoinGame, isLoading }) => {
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'create') {
      if (playerName.trim()) {
        onCreateGame();
      }
    } else {
      if (gameId.trim() && playerName.trim()) {
        onJoinGame(gameId.trim(), playerName.trim());
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center p-4">
      <div className="bg-black/20 rounded-2xl p-8 max-w-md w-full backdrop-blur-sm border border-white/10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-300 mb-2">섯다</h1>
          <p className="text-gray-200">한국 전통 화투 게임</p>
        </div>

        <div className="flex mb-6">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 px-4 rounded-l-lg font-semibold transition-all ${
              mode === 'create'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            게임 생성
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-3 px-4 rounded-r-lg font-semibold transition-all ${
              mode === 'join'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            <LogIn className="w-4 h-4 inline mr-2" />
            게임 참가
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'join' && (
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                게임 ID
              </label>
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                placeholder="게임 ID를 입력하세요"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-white text-sm font-semibold mb-2">
              플레이어 이름
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 px-6 rounded-lg font-bold transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                처리 중...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {mode === 'create' ? (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    게임 생성하기
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5 mr-2" />
                    게임 참가하기
                  </>
                )}
              </div>
            )}
          </button>
        </form>

        <div className="mt-8 p-4 bg-black/20 rounded-lg">
          <h3 className="text-white font-semibold mb-2">게임 방법</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• 두 명의 플레이어가 참가합니다</li>
            <li>• 각자 2장의 카드를 받습니다</li>
            <li>• 베팅을 통해 승부를 겨룹니다</li>
            <li>• 더 좋은 패를 가진 플레이어가 승리합니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;