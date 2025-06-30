import React from 'react';
import { Card as CardType } from '../types/game';

interface CardProps {
  card: CardType | null;
  isHidden?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({ card, isHidden = false, className = '' }) => {
  if (!card || isHidden) {
    return (
      <div className={`w-16 h-24 bg-gradient-to-br from-red-900 to-red-800 rounded-lg border-2 border-red-700 shadow-lg flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 bg-yellow-400 rounded-full opacity-50"></div>
      </div>
    );
  }

  const getCardColor = () => {
    switch (card.type) {
      case 'bright': return 'from-yellow-400 to-yellow-600';
      case 'animal': return 'from-green-400 to-green-600';
      case 'ribbon': return 'from-blue-400 to-blue-600';
      case 'junk': return 'from-gray-400 to-gray-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className={`w-16 h-24 bg-gradient-to-br ${getCardColor()} rounded-lg border-2 border-white shadow-lg flex flex-col items-center justify-center text-white font-bold ${className}`}>
      <div className="text-xs">{card.month}월</div>
      <div className="text-xs text-center px-1 leading-tight">{card.name}</div>
    </div>
  );
};

export default Card;