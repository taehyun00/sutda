import React, { useState, useEffect } from 'react';
import { GameState, BetAction } from '../types/game';
import Player from './Player';
import BettingControls from './BettingControls';
import { Users, Trophy, Clock } from 'lucide-react';

interface GameRoomProps {
  roomId: string;
  playerId: string;
  playerName: string;
  onLeave: () => void;
}

const GameRoom: React.FC<GameRoomProps> = ({ roomId, playerId, playerName, onLeave }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<string>('서버에 연결 중...');

  useEffect(() => {
    // Connect to FastAPI WebSocket
    const wsUrl = `wss://port-0-studa-backend-m19egg9z76496dc6.sel4.cloudtype.app/ws`;
    console.log('Connecting to WebSocket:', wsUrl);
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setMessage('서버에 연결되었습니다. 방에 참가 중...');
      
      // Join room after connection
      const joinMessage = {
        type: 'join_room',
        roomId,
        playerId,
        playerName
      };
      console.log('Sending join_room message:', joinMessage);
      newSocket.send(JSON.stringify(joinMessage));
    };

    newSocket.onclose = (event) => {
      console.log('WebSocket closed:', event);
      setIsConnected(false);
      setMessage('서버와의 연결이 끊어졌습니다.');
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setMessage('연결 오류가 발생했습니다.');
    };

    newSocket.onmessage = (event) => {
      console.log('Received message:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('Parsed message:', data);
        
        switch (data.type) {
          case 'game_state':
            console.log('Setting game state:', data.data);
            setGameState(data.data);
            if (data.data.phase === 'waiting') {
              setMessage('플레이어를 기다리는 중...');
            } else {
              setMessage('게임이 진행 중입니다.');
            }
            break;
          case 'error':
            console.error('Game error:', data.data);
            setMessage(data.data.message);
            break;
          default:
            console.log('Unknown message type:', data);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
        setMessage('메시지 파싱 오류가 발생했습니다.');
      }
    };

    setSocket(newSocket);

    return () => {
      console.log('Closing WebSocket connection');
      newSocket.close();
    };
  }, [roomId, playerId, playerName]);

  const handleBet = (action: BetAction) => {
    if (socket && isConnected && socket.readyState === WebSocket.OPEN) {
      const betMessage = {
        type: 'bet',
        action: action.type,
        amount: action.amount
      };
      console.log('Sending bet message:', betMessage);
      socket.send(JSON.stringify(betMessage));
    }
  };

  const handleReady = () => {
    if (socket && isConnected && socket.readyState === WebSocket.OPEN) {
      const readyMessage = { type: 'ready' };
      console.log('Sending ready message:', readyMessage);
      socket.send(JSON.stringify(readyMessage));
    }
  };

  const handleNewGame = () => {
    if (socket && isConnected && socket.readyState === WebSocket.OPEN) {
      const newGameMessage = { type: 'new_game' };
      console.log('Sending new_game message:', newGameMessage);
      socket.send(JSON.stringify(newGameMessage));
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-black flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">게임 로딩 중...</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            
            <div className={`flex items-center justify-center space-x-2 px-3 py-1 rounded-full mb-4 ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">{isConnected ? '연결됨' : '연결 끊김'}</span>
            </div>

            <div className="text-sm text-gray-500 mb-4">
              방 ID: <span className="font-mono font-bold">{roomId}</span>
            </div>
            
            <button
              onClick={onLeave}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              뒤로 가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const opponent = gameState.players.find(p => p.id !== playerId);
  const isMyTurn = gameState.players[gameState.currentPlayer]?.id === playerId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-black p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Users className="w-6 h-6 text-red-600" />
              <h1 className="text-xl font-bold text-gray-800">섯다 게임 - 방 {roomId}</h1>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">{isConnected ? '연결됨' : '연결 끊김'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-yellow-600">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">{gameState.pot.toLocaleString()}</span>
              </div>
              <button
                onClick={onLeave}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                나가기
              </button>
            </div>
          </div>
        </div>

        {/* Game Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <h3 className="font-bold text-gray-800 mb-2">게임 상태</h3>
            <div className="space-y-2 text-sm">
              <div>단계: <span className="font-medium">{gameState.phase}</span></div>
              <div>라운드: <span className="font-medium">{gameState.round}</span></div>
              <div>플레이어: <span className="font-medium">{gameState.players.length}/2</span></div>
              {isMyTurn && (
                <div className="flex items-center space-x-2 text-green-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">당신의 차례입니다</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg">
            <h3 className="font-bold text-gray-800 mb-2">판돈 정보</h3>
            <div className="space-y-2 text-sm">
              <div>현재 판돈: <span className="font-medium text-yellow-600">{gameState.pot.toLocaleString()}</span></div>
              <div>최소 베팅: <span className="font-medium">{gameState.minBet.toLocaleString()}</span></div>
              <div>최대 베팅: <span className="font-medium">{gameState.maxBet.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg">
            <h3 className="font-bold text-gray-800 mb-2">메시지</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>

        {/* Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {currentPlayer && (
            <Player 
              player={currentPlayer} 
              isCurrentPlayer={isMyTurn}
              isCurrentUser={true}
              showCards={gameState.phase === 'reveal' || gameState.phase === 'finished'}
            />
          )}
          {opponent && (
            <Player 
              player={opponent} 
              isCurrentPlayer={gameState.players[gameState.currentPlayer]?.id === opponent.id}
              showCards={gameState.phase === 'reveal' || gameState.phase === 'finished'}
            />
          )}
          {!opponent && (
            <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-dashed border-gray-300">
              <div className="text-center text-gray-500 py-8">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-medium">상대방을 기다리는 중...</p>
                <p className="text-sm">다른 플레이어가 참가하기를 기다리고 있습니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* Game Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gameState.phase === 'waiting' && currentPlayer && !currentPlayer.isReady && gameState.players.length === 2 && (
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">게임 준비</h3>
              <button
                onClick={handleReady}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                준비 완료
              </button>
            </div>
          )}

          {gameState.phase === 'betting' && isMyTurn && currentPlayer && currentPlayer.status === 'playing' && (
            <BettingControls
              currentBet={gameState.minBet}
              playerChips={currentPlayer.chips}
              potSize={gameState.pot}
              onBet={handleBet}
            />
          )}

          {gameState.phase === 'finished' && gameState.winner && (
            <div className="bg-white rounded-xl p-6 shadow-lg col-span-full">
              <div className="text-center">
                <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">게임 종료!</h2>
                <p className="text-lg text-gray-600 mb-4">
                  승자: <span className="font-bold text-green-600">{gameState.winner}</span>
                </p>
                <button
                  onClick={handleNewGame}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  새 게임 시작
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameRoom;