import React from 'react';
import { Card as CardType } from '../types/game';

interface CardProps {
  card: CardType | null;
  isRevealed: boolean;
  onClick?: () => void;
  className?: string;
}

const Card: React.FC<CardProps> = ({ card, isRevealed, onClick, className = '' }) => {
  const getCardColor = (month: number, type: string) => {
    if (type === 'bright') return 'from-yellow-400 to-orange-500';
    if (type === 'animal') return 'from-blue-400 to-indigo-500';
    if (type === 'ribbon') return 'from-red-400 to-pink-500';
    
    const colors = [
      'from-emerald-400 to-teal-500',
      'from-pink-400 to-rose-500',
      'from-purple-400 to-violet-500',
      'from-indigo-400 to-blue-500',
      'from-cyan-400 to-blue-500',
      'from-teal-400 to-cyan-500',
      'from-lime-400 to-green-500',
      'from-yellow-400 to-amber-500',
      'from-orange-400 to-red-500',
      'from-red-400 to-pink-500',
      'from-violet-400 to-purple-500',
      'from-slate-400 to-gray-500'
    ];
    
    return colors[(month - 1) % 12];
  };

  const getCardSymbol = (month: number) => {
    const symbols = ['🌲', '🌸', '🌺', '🦋', '🌿', '🦋', '🐗', '🌾', '🍶', '🦌', '🍃', '☔'];
    return symbols[month - 1] || '🎴';
  };

  if (!isRevealed) {
    return (
      <div 
        className={`w-20 h-28 bg-gradient-to-br from-red-800 to-red-900 rounded-lg shadow-lg border-2 border-yellow-400 cursor-pointer transform transition-all duration-300 hover:scale-105 ${className}`}
        onClick={onClick}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-yellow-400 text-2xl">🎴</div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-yellow-400/20 to-transparent rounded-lg"></div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className={`w-20 h-28 border-2 border-dashed border-gray-300 rounded-lg ${className}`}>
      </div>
    );
  }

  return (
    <div 
      className={`w-20 h-28 bg-gradient-to-br ${getCardColor(card.month, card.type)} rounded-lg shadow-lg border-2 border-white cursor-pointer transform transition-all duration-300 hover:scale-105 ${className}`}
      onClick={onClick}
    >
      <div className="w-full h-full p-2 flex flex-col justify-between text-white">
        <div className="text-xs font-bold text-center">
          {card.month}월
        </div>
        <div className="text-2xl text-center">
          {getCardSymbol(card.month)}
        </div>
        <div className="text-xs text-center font-semibold">
          {card.type === 'bright' ? '광' : 
           card.type === 'animal' ? '띠' : 
           card.type === 'ribbon' ? '단' : '피'}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-lg"></div>
    </div>
  );
};

export default Card;