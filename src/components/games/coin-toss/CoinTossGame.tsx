'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { CoinSide, CoinTossRound } from '@/types/coin-toss';
import CoinAnimation from './CoinAnimation';
import CoinTossControls from './CoinTossControls';
import CoinTossResult from './CoinTossResult';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { X, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CoinTossGame() {
    const router = useRouter();
    const { wallet, loading, refetch: refetchWallet } = useWallet();
    const [isFlipping, setIsFlipping] = useState(false);
    const [result, setResult] = useState<CoinSide | undefined>();
    const [currentRound, setCurrentRound] = useState<CoinTossRound | null>(null);
    const balance = wallet?.balance ?? 0;

    const handleExit = () => {
        router.push('/');
    };

    const handlePlay = async (betAmount: number, choice: CoinSide) => {
        try {
            setIsFlipping(true);
            setResult(undefined);
            setCurrentRound(null);

            const response = await fetch('/api/games/coin-toss/play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ betAmount, choice }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to play game');
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
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
            
            if (data.isWin) {
                toast.success(`You won $${data.payout.toFixed(2)}!`);
            } else {
                toast.error(`You lost $${betAmount.toFixed(2)}`);
            }

            refetchWallet();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to play game');
        } finally {
            setIsFlipping(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Coin Toss</CardTitle>
                        <Button variant="ghost" size="icon" onClick={handleExit}>
                            <X className="w-6 h-6" />
                        </Button>
                    </div>
                    <CardDescription className="flex items-center gap-2 pt-2">
                        <Wallet className="w-4 h-4" />
                        Balance: ${balance.toFixed(2)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <CoinAnimation isFlipping={isFlipping} result={result} />
                    </div>
                    <div className="space-y-4">
                        <CoinTossControls
                            onPlay={handlePlay}
                            disabled={isFlipping}
                            maxBet={balance}
                        />
                        {currentRound && (
                            <CoinTossResult round={currentRound} />
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 