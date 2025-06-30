import React, { useState } from 'react';
import GameLobby from './components/GameLobby';
import MultiplayerGameBoard from './components/MultiplayerGameBoard';
import { apiService } from './services/api';

function App() {
  const [gameState, setGameState] = useState<{
    gameId: string | null;
    playerId: string | null;
    playerName: string | null;
  }>({
    gameId: null,
    playerId: null,
    playerName: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateGame = async () => {
    const playerName = prompt('플레이어 이름을 입력하세요:');
    if (!playerName?.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { game_id } = await apiService.createGame();
      const { player_id } = await apiService.joinGame(game_id, playerName.trim());
      
      setGameState({
        gameId: game_id,
        playerId: player_id,
        playerName: playerName.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '게임 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async (gameId: string, playerName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { player_id } = await apiService.joinGame(gameId, playerName);
      
      setGameState({
        gameId,
        playerId: player_id,
        playerName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '게임 참가에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGame = () => {
    setGameState({
      gameId: null,
      playerId: null,
      playerName: null,
    });
    setError(null);
  };

  if (gameState.gameId && gameState.playerId && gameState.playerName) {
    return (
      <MultiplayerGameBoard
        gameId={gameState.gameId}
        playerId={gameState.playerId}
        playerName={gameState.playerName}
        onLeaveGame={handleLeaveGame}
      />
    );
  }

  return (
    <div>
      <GameLobby
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
        isLoading={isLoading}
      />
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;