import React from 'react';
import { BetAction } from '../types/game';
import { DollarSign, X, Divide, Target } from 'lucide-react';

interface BettingControlsProps {
  currentBet: number;
  playerChips: number;
  potSize: number;
  onBet: (action: BetAction) => void;
  disabled?: boolean;
}

const BettingControls: React.FC<BettingControlsProps> = ({
  currentBet,
  playerChips,
  potSize,
  onBet,
  disabled = false
}) => {
  const halfPot = Math.floor(potSize / 2);
  const canCall = currentBet <= playerChips;
  const canHalf = halfPot <= playerChips;

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">베팅 선택</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onBet({ type: 'call' })}
          disabled={disabled || !canCall}
          className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          <Target className="w-4 h-4" />
          <span>콜 ({currentBet.toLocaleString()})</span>
        </button>

        <button
          onClick={() => onBet({ type: 'fold' })}
          disabled={disabled}
          className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          <span>다이</span>
        </button>

        <button
          onClick={() => onBet({ type: 'half', amount: halfPot })}
          disabled={disabled || !canHalf}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          <Divide className="w-4 h-4" />
          <span>하프 ({halfPot.toLocaleString()})</span>
        </button>

        <button
          onClick={() => onBet({ type: 'all-in', amount: playerChips })}
          disabled={disabled}
          className="flex items-center justify-center space-x-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          <DollarSign className="w-4 h-4" />
          <span>올인</span>
        </button>
      </div>

      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600">
          현재 판돈: <span className="font-bold text-green-600">{potSize.toLocaleString()}</span>
        </div>
        <div className="text-sm text-gray-600">
          내 칩: <span className="font-bold text-blue-600">{playerChips.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default BettingControls;