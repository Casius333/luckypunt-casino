'use client';

import { useState } from 'react';
import { CoinSide } from '@/types/coin-toss';

interface CoinTossControlsProps {
    onPlay: (betAmount: number, choice: CoinSide) => void;
    disabled: boolean;
    maxBet: number;
}

const PRESET_AMOUNTS = [1, 5, 10, 25, 50, 100];

const CoinTossControls = ({ onPlay, disabled, maxBet }: CoinTossControlsProps) => {
    const [betAmount, setBetAmount] = useState<number>(1);
    const [selectedSide, setSelectedSide] = useState<CoinSide>('heads');

    const handlePlay = () => {
        if (betAmount <= 0 || betAmount > maxBet || disabled) return;
        onPlay(betAmount, selectedSide);
    };

    return (
        <div className="space-y-6 p-4 bg-gray-800 rounded-lg">
            <div className="space-y-2">
                <label className="block text-sm font-medium">Bet Amount</label>
                <div className="grid grid-cols-3 gap-2">
                    {PRESET_AMOUNTS.map(amount => (
                        <button
                            key={amount}
                            onClick={() => setBetAmount(amount)}
                            className={`py-2 px-4 rounded ${
                                betAmount === amount
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 hover:bg-gray-600'
                            } ${amount > maxBet ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={amount > maxBet}
                        >
                            ${amount}
                        </button>
                    ))}
                </div>
                <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.min(maxBet, Math.max(0, Number(e.target.value))))}
                    className="w-full mt-2 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                    min={0}
                    max={maxBet}
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium">Choose Side</label>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setSelectedSide('heads')}
                        className={`py-3 px-6 rounded-lg flex items-center justify-center ${
                            selectedSide === 'heads'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                        Heads
                    </button>
                    <button
                        onClick={() => setSelectedSide('tails')}
                        className={`py-3 px-6 rounded-lg flex items-center justify-center ${
                            selectedSide === 'tails'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                        Tails
                    </button>
                </div>
            </div>

            <button
                onClick={handlePlay}
                disabled={disabled || betAmount <= 0 || betAmount > maxBet}
                className={`w-full py-3 px-6 rounded-lg text-white text-lg font-semibold ${
                    disabled || betAmount <= 0 || betAmount > maxBet
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                }`}
            >
                {disabled ? 'Flipping...' : 'Flip Coin'}
            </button>
        </div>
    );
};

export default CoinTossControls; 