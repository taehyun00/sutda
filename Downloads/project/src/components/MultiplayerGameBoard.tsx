import React, { useState, useEffect } from 'react';
import { GameState, Player as PlayerType, apiService } from '../services/api';
import { calculateHand } from '../utils/gameLogic';
import Player from './Player';
import { Coins, RotateCcw, Play, TrendingUp, Skull, Copy, Check } from 'lucide-react';

interface MultiplayerGameBoardProps {
  gameId: string;
  playerId: string;
  playerName: string;
  onLeaveGame: () => void;
}

const MultiplayerGameBoard: React.FC<MultiplayerGameBoardProps> = ({
  gameId,
  playerId,
  playerName,
  onLeaveGame
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [handResults, setHandResults] = useState<any[]>([]);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [raiseAmount, setRaiseAmount] = useState(500);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // WebSocket 연결
    const websocket = apiService.connectWebSocket(playerId, (data) => {
      if (data.type === 'game_state') {
        setGameState(data.data);
        
        // 패 결과 계산 (카드가 공개된 경우)
        if (data.data.phase === 'result' || data.data.phase === 'reveal') {
          const results = data.data.players.map((player: PlayerType) => {
            if (player.cards.length === 2 && !player.folded) {
              return calculateHand(player.cards);
            }
            return null;
          });
          setHandResults(results);
        }
      }
    });

    setWs(websocket);

    // 초기 게임 상태 로드
    loadGameState();

    return () => {
      websocket.close();
    };
  }, [gameId, playerId]);

  const loadGameState = async () => {
    try {
      const game = await apiService.getGame(gameId);
      setGameState(game);
    } catch (err) {
      setError('게임 상태를 불러올 수 없습니다.');
    }
  };

  const makeAction = async (action: string, customAmount?: number) => {
    if (!gameState || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiService.makeAction(gameId, playerId, action, customAmount);
      addToHistory(`${playerName}: ${result.action}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '액션을 수행할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const revealCards = async () => {
    if (!gameState || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await apiService.revealCards(gameId);
      addToHistory('카드 공개!');
    } catch (err) {
      setError(err instanceof Error ? err.message : '카드를 공개할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextRound = async () => {
    if (!gameState || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiService.nextRound(gameId);
      if (result.game_finished) {
        addToHistory('게임이 종료되었습니다!');
      } else {
        addToHistory(`${gameState.round + 1}라운드 시작`);
        setHandResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '다음 라운드를 시작할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const addToHistory = (message: string) => {
    setGameHistory(prev => [...prev.slice(-9), message]);
  };

  const copyGameId = async () => {
    try {
      await navigator.clipboard.writeText(gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy game ID:', err);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>게임을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isMyTurn = gameState.players[gameState.current_player]?.id === playerId;
  const canAct = gameState.phase === 'betting' && isMyTurn && !currentPlayer?.folded;
  const showCards = gameState.phase === 'reveal' || gameState.phase === 'result';
  const callAmount = currentPlayer ? gameState.current_bet - currentPlayer.bet : 0;

  // 대기 중인 경우
  if (gameState.phase === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center p-4">
        <div className="bg-black/20 rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-4">게임 대기 중</h2>
          <p className="text-gray-300 mb-6">다른 플레이어를 기다리고 있습니다...</p>
          
          <div className="bg-black/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-300 mb-2">게임 ID를 공유하세요:</p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-black/30 px-3 py-2 rounded text-yellow-300 text-sm">
                {gameId}
              </code>
              <button
                onClick={copyGameId}
                className="p-2 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-300">
            <p>참가한 플레이어:</p>
            {gameState.players.map((player, index) => (
              <div key={player.id} className="bg-black/20 rounded px-3 py-2">
                {player.name} {player.id === playerId && '(나)'}
              </div>
            ))}
          </div>

          <button
            onClick={onLeaveGame}
            className="mt-6 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            게임 나가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-yellow-300 mb-2">섯다</h1>
          <p className="text-gray-200">멀티플레이어 게임</p>
          <div className="mt-2 text-sm text-gray-300">
            게임 ID: <code className="bg-black/20 px-2 py-1 rounded">{gameId}</code>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 게임 영역 */}
          <div className="lg:col-span-3">
            {/* 라운드 정보 */}
            <div className="bg-black/20 rounded-xl p-4 mb-6 text-center">
              <div className="flex justify-center items-center space-x-6">
                <div className="text-white">
                  <span className="text-lg font-semibold">{gameState.round}라운드</span>
                </div>
                <div className="flex items-center space-x-2 text-yellow-400">
                  <Coins className="w-5 h-5" />
                  <span className="text-lg font-bold">팟머니: {gameState.pot.toLocaleString()}원</span>
                </div>
                {gameState.current_bet > 0 && (
                  <div className="text-red-400">
                    현재 베팅: {gameState.current_bet.toLocaleString()}원
                  </div>
                )}
                {gameState.winner && (
                  <div className="text-green-400 font-bold text-lg">
                    🎉 {gameState.winner} 승리!
                  </div>
                )}
              </div>
            </div>

            {/* 플레이어들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {gameState.players.map((player, index) => (
                <Player
                  key={player.id}
                  player={player}
                  handResult={handResults[index]}
                  isCurrentPlayer={gameState.current_player === index && gameState.phase === 'betting'}
                  showCards={showCards}
                  isMe={player.id === playerId}
                />
              ))}
            </div>

            {/* 게임 컨트롤 */}
            <div className="bg-black/20 rounded-xl p-6">
              {gameState.phase === 'betting' && isMyTurn && !currentPlayer?.folded && (
                <div className="space-y-4">
                  <h3 className="text-white text-xl text-center mb-4">당신의 차례</h3>
                  
                  {/* 레이즈 금액 설정 */}
                  <div className="flex justify-center items-center space-x-4 mb-4">
                    <span className="text-white">레이즈 금액:</span>
                    {[300, 500, 1000, 2000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setRaiseAmount(amount)}
                        className={`px-3 py-1 rounded ${
                          raiseAmount === amount 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-600 text-gray-200'
                        }`}
                      >
                        {amount}원
                      </button>
                    ))}
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <button
                      onClick={() => makeAction('call')}
                      disabled={!canAct || isLoading || (currentPlayer && currentPlayer.money < callAmount)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-all transform hover:scale-105 disabled:scale-100"
                    >
                      {callAmount === 0 ? '체크' : `콜 (${callAmount.toLocaleString()}원)`}
                    </button>

                    <button
                      onClick={() => makeAction('raise', raiseAmount)}
                      disabled={!canAct || isLoading || (currentPlayer && currentPlayer.money < callAmount + raiseAmount)}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-all transform hover:scale-105 disabled:scale-100"
                    >
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      레이즈
                    </button>

                    <button
                      onClick={() => makeAction('half')}
                      disabled={!canAct || isLoading || gameState.pot === 0 || (currentPlayer && currentPlayer.money < callAmount + Math.floor(gameState.pot / 2))}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-all transform hover:scale-105 disabled:scale-100"
                    >
                      하프
                    </button>

                    <button
                      onClick={() => makeAction('allin')}
                      disabled={!canAct || isLoading}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black px-4 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                    >
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      올인
                    </button>

                    <button
                      onClick={() => makeAction('die')}
                      disabled={!canAct || isLoading}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                    >
                      <Skull className="w-4 h-4 inline mr-1" />
                      다이
                    </button>
                  </div>
                </div>
              )}

              {gameState.phase === 'betting' && !isMyTurn && (
                <div className="text-center text-white">
                  <div className="text-lg">상대방의 차례입니다...</div>
                  <div className="mt-2">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
                </div>
              )}

              {gameState.phase === 'reveal' && (
                <div className="text-center">
                  <button
                    onClick={revealCards}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-black px-8 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:scale-100"
                  >
                    <Play className="w-5 h-5 inline mr-2" />
                    카드 공개
                  </button>
                </div>
              )}

              {gameState.phase === 'result' && (
                <div className="text-center">
                  <button
                    onClick={nextRound}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:scale-100"
                  >
                    <RotateCcw className="w-5 h-5 inline mr-2" />
                    다음 라운드
                  </button>
                </div>
              )}

              {gameState.phase === 'finished' && (
                <div className="text-center">
                  <div className="text-white text-xl mb-4">게임이 종료되었습니다!</div>
                  <button
                    onClick={onLeaveGame}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
                  >
                    로비로 돌아가기
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 게임 히스토리 */}
            <div className="bg-black/20 rounded-xl p-4">
              <h3 className="text-white text-lg font-semibold mb-3">게임 기록</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {gameHistory.map((entry, index) => (
                  <div key={index} className="text-sm text-gray-300 p-2 bg-black/20 rounded">
                    {entry}
                  </div>
                ))}
              </div>
            </div>

            {/* 게임 규칙 */}
            <div className="bg-black/20 rounded-xl p-4">
              <h3 className="text-white text-lg font-semibold mb-3">섯다 규칙</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <div><strong className="text-yellow-400">베팅 액션:</strong></div>
                <div>• 체크/콜: 현재 베팅에 맞춤</div>
                <div>• 레이즈: 베팅 금액 올림</div>
                <div>• 하프: 팟머니의 절반 베팅</div>
                <div>• 올인: 모든 돈 베팅</div>
                <div>• 다이: 포기</div>
                
                <div className="mt-3"><strong className="text-yellow-400">특수패:</strong></div>
                <div>• 38광땡 (최고)</div>
                <div>• 13광땡, 18광땡</div>
                <div>• 일삼, 일팔, 삼팔</div>
                
                <div className="mt-3"><strong className="text-yellow-400">땡:</strong></div>
                <div>• 장땡(10) → 1땡 순</div>
                
                <div className="mt-3"><strong className="text-yellow-400">끝수:</strong></div>
                <div>• 9끝 → 0끝 순</div>
              </div>
            </div>

            {/* 게임 나가기 */}
            <div className="bg-black/20 rounded-xl p-4">
              <button
                onClick={onLeaveGame}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
              >
                게임 나가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerGameBoard;