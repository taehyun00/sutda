import React, { useState } from 'react';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';

function App() {
  const [currentView, setCurrentView] = useState<'lobby' | 'game'>('lobby');
  const [roomId, setRoomId] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');

  const handleJoinRoom = (newRoomId: string, newPlayerName: string) => {
    setRoomId(newRoomId);
    setPlayerName(newPlayerName);
    setPlayerId(Math.random().toString(36).substring(2, 15));
    setCurrentView('game');
  };

  const handleLeaveRoom = () => {
    setCurrentView('lobby');
    setRoomId('');
    setPlayerId('');
    setPlayerName('');
  };

  if (currentView === 'game') {
    return (
      <GameRoom
        roomId={roomId}
        playerId={playerId}
        playerName={playerName}
        onLeave={handleLeaveRoom}
      />
    );
  }

  return <Lobby onJoinRoom={handleJoinRoom} />;
}

export default App;