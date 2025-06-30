import React, { useState, useEffect } from 'react';
import { GameState, Player as PlayerType, HandResult } from '../types/game';
import { shuffleCards, dealCards } from '../utils/cards';
import { calculateHand, getWinner } from '../utils/gameLogic';
import Player from './Player';
import { Coins, RotateCcw, Play, Skull, TrendingUp, TrendingDown } from 'lucide-react';

const GameBoard: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: [
      { id: '1', name: '플레이어', cards: [], money: 10000, bet: 0, isAI: false, folded: false },
      { id: '2', name: 'AI 상대', cards: [], money: 10000, bet: 0, isAI: true, folded: false }
    ],
    currentPlayer: 0,
    phase: 'dealing',
    pot: 0,
    round: 1,
    winner: null,
    currentBet: 0,
    bettingRound: 1,
    lastRaisePlayer: null
  });

  const [handResults, setHandResults] = useState<HandResult[]>([]);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [raiseAmount, setRaiseAmount] = useState(500);

  const startNewRound = () => {
    const shuffledCards = shuffleCards();
    const hands = dealCards(shuffledCards, 2);
    
    setGameState(prev => ({
      ...prev,
      players: prev.players.map((player, index) => ({
        ...player,
        cards: hands[index],
        bet: 0,
        action: null,
        folded: false
      })),
      currentPlayer: 0,
      phase: 'dealing',
      pot: 0,
      winner: null,
      currentBet: 0,
      bettingRound: 1,
      lastRaisePlayer: null
    }));
    
    setHandResults([]);
    addToHistory(`${gameState.round}라운드 시작 - 카드 배급`);
    
    // 카드 배급 후 베팅 단계로 전환
    setTimeout(() => {
      setGameState(prev => ({ ...prev, phase: 'betting' }));
      addToHistory('베팅 시작');
    }, 1500);
  };

  const makeAction = (action: 'call' | 'raise' | 'die' | 'half' | 'allin', customRaiseAmount?: number) => {
    if (gameState.phase !== 'betting') return;
    
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (currentPlayer.folded) return;

    let betAmount = 0;
    let actionName = '';
    let newCurrentBet = gameState.currentBet;

    switch (action) {
      case 'call':
        betAmount = gameState.currentBet - currentPlayer.bet;
        actionName = gameState.currentBet === 0 ? '체크' : '콜';
        break;
      case 'raise':
        const raiseAmountToUse = customRaiseAmount || raiseAmount;
        betAmount = (gameState.currentBet - currentPlayer.bet) + raiseAmountToUse;
        newCurrentBet = currentPlayer.bet + betAmount;
        actionName = `${raiseAmountToUse.toLocaleString()}원 레이즈`;
        break;
      case 'die':
        actionName = '다이';
        break;
      case 'half':
        const halfAmount = Math.max(Math.floor(gameState.pot / 2), 500);
        betAmount = (gameState.currentBet - currentPlayer.bet) + halfAmount;
        newCurrentBet = currentPlayer.bet + betAmount;
        actionName = `하프 (${halfAmount.toLocaleString()}원)`;
        break;
      case 'allin':
        betAmount = currentPlayer.money;
        newCurrentBet = currentPlayer.bet + betAmount;
        actionName = `올인 (${betAmount.toLocaleString()}원)`;
        break;
    }

    if (action !== 'die' && currentPlayer.money < betAmount) return;

    setGameState(prev => {
      const newPlayers = prev.players.map((player, index) => {
        if (index === prev.currentPlayer) {
          if (action === 'die') {
            return { ...player, action, folded: true };
          } else {
            return {
              ...player,
              money: player.money - betAmount,
              bet: player.bet + betAmount,
              action
            };
          }
        }
        return player;
      });

      const newPot = action !== 'die' ? prev.pot + betAmount : prev.pot;
      const newLastRaisePlayer = (action === 'raise' || action === 'half' || action === 'allin') 
        ? prev.currentPlayer 
        : prev.lastRaisePlayer;
      
      // 활성 플레이어 확인
      const activePlayers = newPlayers.filter(p => !p.folded);
      
      // 한 명만 남은 경우 즉시 게임 종료
      if (activePlayers.length === 1) {
        return {
          ...prev,
          players: newPlayers,
          pot: newPot,
          currentBet: newCurrentBet,
          phase: 'result',
          winner: activePlayers[0].name
        };
      }

      // 다음 플레이어 결정
      let nextPlayer = (prev.currentPlayer + 1) % prev.players.length;
      while (newPlayers[nextPlayer].folded) {
        nextPlayer = (nextPlayer + 1) % prev.players.length;
      }

      // 베팅 라운드 종료 조건 체크
      const allMatched = activePlayers.every(p => p.bet === newCurrentBet || p.money === 0);
      const hasActed = activePlayers.every(p => p.action !== null);
      
      // 베팅이 완료된 경우
      const bettingComplete = allMatched && hasActed && (
        newLastRaisePlayer === null || 
        activePlayers.filter(p => p.action !== null).length >= activePlayers.length
      );

      return {
        ...prev,
        players: newPlayers,
        currentPlayer: nextPlayer,
        pot: newPot,
        currentBet: newCurrentBet,
        lastRaisePlayer: newLastRaisePlayer,
        phase: bettingComplete ? 'reveal' : 'betting'
      };
    });

    addToHistory(`${currentPlayer.name}: ${actionName}`);
  };

  // AI 턴 처리를 useEffect로 분리
  useEffect(() => {
    if (gameState.phase === 'betting' && 
        gameState.currentPlayer === 1 && 
        !gameState.players[1].folded &&
        !gameState.players[1].action) {
      
      const timer = setTimeout(() => {
        handleAIAction();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.phase, gameState.players[1].action]);

  const handleAIAction = () => {
    const aiPlayer = gameState.players[1];
    if (aiPlayer.folded || gameState.phase !== 'betting' || aiPlayer.action) return;

    const aiHandResult = calculateHand(aiPlayer.cards);
    const callAmount = gameState.currentBet - aiPlayer.bet;
    
    let action: 'call' | 'raise' | 'die' | 'half' | 'allin' = 'call';
    let customAmount = 0;

    // AI 의사결정 로직
    const handStrength = aiHandResult.rank;
    const potOdds = gameState.pot > 0 ? callAmount / gameState.pot : 1;
    
    if (handStrength > 950) { // 최고급 패 (38광땡, 13광땡, 18광땡)
      if (Math.random() > 0.2) {
        action = 'allin';
      } else {
        action = 'raise';
        customAmount = Math.min(2000, aiPlayer.money - callAmount);
      }
    } else if (handStrength > 850) { // 높은 땡
      if (Math.random() > 0.3) {
        action = 'raise';
        customAmount = Math.min(1000, aiPlayer.money - callAmount);
      } else if (Math.random() > 0.1) {
        action = 'call';
      } else {
        action = 'half';
      }
    } else if (handStrength > 750) { // 중간 땡
      if (Math.random() > 0.5) {
        action = 'call';
      } else if (Math.random() > 0.3) {
        action = 'raise';
        customAmount = Math.min(500, aiPlayer.money - callAmount);
      } else {
        action = 'die';
      }
    } else if (handStrength > 680) { // 높은 끝수 (7끝 이상)
      if (potOdds < 0.3 && Math.random() > 0.4) {
        action = 'call';
      } else if (Math.random() > 0.7) {
        action = 'raise';
        customAmount = Math.min(300, aiPlayer.money - callAmount);
      } else {
        action = 'die';
      }
    } else { // 낮은 끝수
      if (potOdds < 0.2 && Math.random() > 0.7) {
        action = 'call';
      } else {
        action = 'die';
      }
    }

    // 돈이 부족한 경우 조정
    if (action === 'raise' && aiPlayer.money < callAmount + customAmount) {
      if (aiPlayer.money >= callAmount) {
        action = 'call';
      } else {
        action = 'die';
      }
    }

    if (action === 'half' && aiPlayer.money < callAmount + Math.floor(gameState.pot / 2)) {
      action = aiPlayer.money >= callAmount ? 'call' : 'die';
    }

    makeAction(action, customAmount);
  };

  const revealCards = () => {
    const results = gameState.players.map(player => calculateHand(player.cards));
    setHandResults(results);
    
    const activePlayers = gameState.players.filter(p => !p.folded);
    if (activePlayers.length === 1) {
      // 한 명만 남은 경우
      const winnerIndex = gameState.players.findIndex(p => !p.folded);
      const winnerName = gameState.players[winnerIndex].name;
      
      setGameState(prev => ({
        ...prev,
        phase: 'result',
        winner: winnerName,
        players: prev.players.map((player, index) => 
          index === winnerIndex 
            ? { ...player, money: player.money + prev.pot }
            : player
        )
      }));
      
      addToHistory(`${winnerName} 승리! (상대방 폴드)`);
    } else {
      // 패 비교
      const activeResults = results.filter((_, index) => !gameState.players[index].folded);
      const activeIndices = gameState.players.map((_, index) => index).filter(index => !gameState.players[index].folded);
      
      const winners = getWinner(activeResults);
      const winnerIndices = winners.map(winnerIdx => activeIndices[winnerIdx]);
      const winnerName = winnerIndices.length === 1 ? gameState.players[winnerIndices[0]].name : '무승부';
      
      setGameState(prev => ({
        ...prev,
        phase: 'result',
        winner: winnerName,
        players: prev.players.map((player, index) => 
          winnerIndices.includes(index) 
            ? { ...player, money: player.money + Math.floor(prev.pot / winnerIndices.length) }
            : player
        )
      }));

      addToHistory(`카드 공개: ${winnerName} 승리!`);
      results.forEach((result, index) => {
        if (!gameState.players[index].folded) {
          addToHistory(`${gameState.players[index].name}: ${result.name}`);
        }
      });
    }
  };

  const nextRound = () => {
    // 게임 종료 조건 체크 (한 플레이어가 파산)
    const bankruptPlayers = gameState.players.filter(p => p.money <= 0);
    if (bankruptPlayers.length > 0) {
      addToHistory(`게임 종료! ${bankruptPlayers[0].name}이(가) 파산했습니다.`);
      return;
    }

    // 라운드 증가 및 새 라운드 시작
    setGameState(prev => ({
      ...prev,
      round: prev.round + 1,
      phase: 'dealing',
      winner: null,
      pot: 0,
      currentBet: 0,
      bettingRound: 1,
      lastRaisePlayer: null,
      currentPlayer: 0,
      players: prev.players.map(player => ({
        ...player,
        cards: [],
        bet: 0,
        action: null,
        folded: false
      }))
    }));

    setHandResults([]);
    
    // 새 라운드 시작
    setTimeout(() => {
      startNewRound();
    }, 500);
  };

  const addToHistory = (message: string) => {
    setGameHistory(prev => [...prev.slice(-9), message]);
  };

  useEffect(() => {
    if (gameState.round === 1 && gameState.players[0].cards.length === 0) {
      startNewRound();
    }
  }, []);

  // 한 명만 남았을 때 자동으로 승리 처리
  useEffect(() => {
    if (gameState.phase === 'result' && gameState.winner) {
      const winnerIndex = gameState.players.findIndex(p => p.name === gameState.winner);
      if (winnerIndex !== -1 && gameState.pot > 0) {
        setGameState(prev => ({
          ...prev,
          players: prev.players.map((player, index) => 
            index === winnerIndex 
              ? { ...player, money: player.money + prev.pot }
              : player
          ),
          pot: 0
        }));
      }
    }
  }, [gameState.phase, gameState.winner]);

  const currentPlayer = gameState.players[gameState.currentPlayer];
  const canAct = gameState.phase === 'betting' && gameState.currentPlayer === 0 && !currentPlayer.folded;
  const showCards = gameState.phase === 'reveal' || gameState.phase === 'result';
  const callAmount = gameState.currentBet - currentPlayer.bet;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-yellow-300 mb-2">섯다</h1>
          <p className="text-gray-200">한국 전통 화투 게임</p>
        </div>

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
                {gameState.currentBet > 0 && (
                  <div className="text-red-400">
                    현재 베팅: {gameState.currentBet.toLocaleString()}원
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
                  isCurrentPlayer={gameState.currentPlayer === index && gameState.phase === 'betting'}
                  showCards={showCards}
                />
              ))}
            </div>

            {/* 게임 컨트롤 */}
            <div className="bg-black/20 rounded-xl p-6">
              {gameState.phase === 'dealing' && (
                <div className="text-center text-white">
                  <div className="text-lg">카드를 배급하고 있습니다...</div>
                  <div className="mt-2">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
                </div>
              )}

              {gameState.phase === 'betting' && gameState.currentPlayer === 0 && !currentPlayer.folded && (
                <div className="space-y-4">
                  <h3 className="text-white text-xl text-center mb-4">당신의 차례</h3>
                  
                  {/* 레이즈 금액 설정 */}
                  <div className="flex justify-center items-center space-x-4 mb-4">
                    <span className="text-white">레이즈 금액:</span>
                    <button
                      onClick={() => setRaiseAmount(300)}
                      className={`px-3 py-1 rounded ${raiseAmount === 300 ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-200'}`}
                    >
                      300원
                    </button>
                    <button
                      onClick={() => setRaiseAmount(500)}
                      className={`px-3 py-1 rounded ${raiseAmount === 500 ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-200'}`}
                    >
                      500원
                    </button>
                    <button
                      onClick={() => setRaiseAmount(1000)}
                      className={`px-3 py-1 rounded ${raiseAmount === 1000 ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-200'}`}
                    >
                      1000원
                    </button>
                    <button
                      onClick={() => setRaiseAmount(2000)}
                      className={`px-3 py-1 rounded ${raiseAmount === 2000 ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-200'}`}
                    >
                      2000원
                    </button>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {/* 콜/체크 */}
                    <button
                      onClick={() => makeAction('call')}
                      disabled={!canAct || currentPlayer.money < callAmount}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-all transform hover:scale-105 disabled:scale-100"
                    >
                      {callAmount === 0 ? '체크' : `콜 (${callAmount.toLocaleString()}원)`}
                    </button>

                    {/* 레이즈 */}
                    <button
                      onClick={() => makeAction('raise')}
                      disabled={!canAct || currentPlayer.money < callAmount + raiseAmount}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-all transform hover:scale-105 disabled:scale-100"
                    >
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      레이즈
                    </button>

                    {/* 하프 */}
                    <button
                      onClick={() => makeAction('half')}
                      disabled={!canAct || gameState.pot === 0 || currentPlayer.money < callAmount + Math.floor(gameState.pot / 2)}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-all transform hover:scale-105 disabled:scale-100"
                    >
                      하프
                    </button>

                    {/* 올인 */}
                    <button
                      onClick={() => makeAction('allin')}
                      disabled={!canAct}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black px-4 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                    >
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      올인
                    </button>

                    {/* 다이 */}
                    <button
                      onClick={() => makeAction('die')}
                      disabled={!canAct}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                    >
                      <Skull className="w-4 h-4 inline mr-1" />
                      다이
                    </button>
                  </div>
                </div>
              )}

              {gameState.phase === 'betting' && gameState.currentPlayer === 1 && !gameState.players[1].folded && (
                <div className="text-center text-white">
                  <div className="text-lg">AI가 행동을 결정하고 있습니다...</div>
                  <div className="mt-2">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
                </div>
              )}

              {gameState.phase === 'reveal' && (
                <div className="text-center">
                  <button
                    onClick={revealCards}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black px-8 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
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
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
                  >
                    <RotateCcw className="w-5 h-5 inline mr-2" />
                    다음 라운드
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;