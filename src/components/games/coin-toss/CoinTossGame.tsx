'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { formatCurrency } from '@/lib/utils';
import { CoinSide, CoinTossRound } from '@/types/coin-toss';
import CoinAnimation from './CoinAnimation';
import CoinTossControls from './CoinTossControls';
import CoinTossResult from './CoinTossResult';
import { toast } from 'react-hot-toast';

export default function CoinTossGame() {
    const router = useRouter();
    const { wallet, isLoading } = useWallet();
    const [isFlipping, setIsFlipping] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CoinSide | undefined>();
    const [currentRound, setCurrentRound] = useState<CoinTossRound | null>(null);
    const balance = wallet?.balance ?? 0;

    const handleExit = () => {
        router.push('/');
    };

    const handlePlay = async (betAmount: number, choice: CoinSide) => {
        try {
            setError(null);
            setIsFlipping(true);
            setResult(undefined);
            setCurrentRound(null);

            // Start animation before API call
            const response = await fetch('/api/games/coin-toss/play', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ betAmount, choice }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to play game');
            }

            // Wait for animation duration (1.5s)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Update game state with result
            setResult(data.result);
            setCurrentRound({
                bet_amount: betAmount,
                player_choice: choice,
                result: data.result,
                is_win: data.isWin,
                payout_amount: data.payout,
                player_balance_before: balance,
                player_balance_after: data.newBalance
            });

            // Show toast notification
            if (data.isWin) {
                toast.success(`You won $${formatCurrency(data.payout)}!`);
            } else {
                toast.error(`You lost $${formatCurrency(betAmount)}`);
            }

            // Force a UI refresh to ensure balance is updated
            router.refresh();
        } catch (error) {
            console.error('Game error:', error);
            setError(error instanceof Error ? error.message : 'Failed to play game');
            setIsFlipping(false);
            toast.error('Failed to play game');
        } finally {
            setIsFlipping(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-gray-900 text-white p-6">
            <button
                onClick={handleExit}
                className="fixed top-4 right-4 p-2 hover:bg-gray-800 rounded-full transition-colors"
                title="Exit Game"
            >
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
            </button>

            <div className="flex flex-col items-center space-y-6">
                <div className="flex items-center justify-between w-full">
                    <h1 className="text-2xl font-bold text-white">Coin Toss</h1>
                    <div className="text-white">
                        Balance: ${formatCurrency(balance)}
                    </div>
                </div>
                
                <div className="w-full max-w-md mx-auto">
                    <CoinAnimation isFlipping={isFlipping} result={result} />

                    {error && (
                        <div className="mt-4 p-4 bg-red-900/50 text-red-200 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <CoinTossControls
                        onPlay={handlePlay}
                        disabled={isFlipping}
                        maxBet={balance}
                    />

                    {currentRound && (
                        <div className="mt-6">
                            <CoinTossResult round={currentRound} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 