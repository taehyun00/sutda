import React from 'react';
import { Player as PlayerType } from '../types/game';
import { User, DollarSign } from 'lucide-react';
import Card from './Card';

interface PlayerProps {
  player: PlayerType;
  isCurrentPlayer?: boolean;
  isCurrentUser?: boolean;
  showCards?: boolean;
}

const Player: React.FC<PlayerProps> = ({ 
  player, 
  isCurrentPlayer = false, 
  isCurrentUser = false,
  showCards = false 
}) => {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-lg border-2 transition-all duration-300 ${
      isCurrentPlayer ? 'border-yellow-400 shadow-yellow-400/30' : 'border-gray-200'
    } ${isCurrentUser ? 'ring-2 ring-blue-400' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-800">{player.name}</span>
          {isCurrentUser && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">You</span>}
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          player.status === 'playing' ? 'bg-green-100 text-green-800' :
          player.status === 'folded' ? 'bg-red-100 text-red-800' :
          player.status === 'all-in' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {player.status.toUpperCase()}
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-3">
        <div className="flex items-center space-x-1">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-700">{player.chips.toLocaleString()}</span>
        </div>
        {player.currentBet > 0 && (
          <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
            Bet: {player.currentBet.toLocaleString()}
          </div>
        )}
      </div>

      <div className="flex space-x-2 mb-2">
        {player.cards.map((card, index) => (
          <Card 
            key={index} 
            card={card} 
            isHidden={!showCards && !isCurrentUser}
            className="transform hover:scale-105 transition-transform"
          />
        ))}
      </div>

      {(showCards || isCurrentUser) && player.handName && (
        <div className="text-center">
          <span className="text-sm font-bold text-purple-800 bg-purple-100 px-2 py-1 rounded">
            {player.handName}
          </span>
        </div>
      )}
    </div>
  );
};

export default Player;