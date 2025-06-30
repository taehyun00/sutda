import React from 'react';
import { Player as PlayerType } from '../services/api';
import { HandResult } from '../types/game';
import Card from './Card';
import { User, Skull } from 'lucide-react';

interface PlayerProps {
  player: PlayerType;
  handResult?: HandResult;
  isCurrentPlayer: boolean;
  showCards: boolean;
  isMe?: boolean;
  onCardClick?: () => void;
}

const Player: React.FC<PlayerProps> = ({ 
  player, 
  handResult, 
  isCurrentPlayer, 
  showCards,
  isMe = false,
  onCardClick 
}) => {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'call': return 'bg-blue-500';
      case 'raise': return 'bg-red-500';
      case 'die': return 'bg-gray-600';
      case 'half': return 'bg-purple-500';
      case 'allin': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'call': return '콜';
      case 'raise': return '레이즈';
      case 'die': return '다이';
      case 'half': return '하프';
      case 'allin': return '올인';
      default: return action;
    }
  };

  return (
    <div className={`p-4 rounded-xl transition-all duration-300 ${
      player.folded 
        ? 'bg-gray-800/50 border border-gray-600' 
        : isCurrentPlayer 
          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400' 
          : 'bg-white/10 border border-white/20'
    }`}>
      {/* 플레이어 정보 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-400" />
          <span className={`font-semibold ${player.folded ? 'text-gray-400' : 'text-white'}`}>
            {player.name} {isMe && '(나)'}
          </span>
          {player.folded && <Skull className="w-4 h-4 text-red-400" />}
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-300">보유금</div>
          <div className={`font-bold ${player.folded ? 'text-gray-400' : 'text-yellow-400'}`}>
            {player.money.toLocaleString()}원
          </div>
        </div>
      </div>

      {/* 베팅 금액 */}
      {player.bet > 0 && (
        <div className="mb-3 text-center">
          <div className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            베팅: {player.bet.toLocaleString()}원
          </div>
        </div>
      )}

      {/* 마지막 액션 */}
      {player.action && (
        <div className="mb-3 text-center">
          <div className={`inline-block ${getActionColor(player.action)} text-white px-3 py-1 rounded-full text-sm font-bold`}>
            {getActionText(player.action)}
          </div>
        </div>
      )}

      {/* 카드 */}
      <div className="flex justify-center space-x-2 mb-3">
        {player.cards.map((card, index) => (
          <Card
            key={index}
            card={card}
            isRevealed={showCards || isMe}
            onClick={onCardClick}
            className={`transform hover:rotate-3 ${player.folded ? 'opacity-50' : ''}`}
          />
        ))}
      </div>

      {/* 패 결과 */}
      {handResult && showCards && !player.folded && (
        <div className="text-center">
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
            handResult.type === 'special' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' :
            handResult.type === 'ddang' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
            'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
          }`}>
            {handResult.name}
          </div>
        </div>
      )}

      {/* 현재 플레이어 표시 */}
      {isCurrentPlayer && !player.folded && (
        <div className="text-center mt-2">
          <div className="inline-block bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
            차례
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;