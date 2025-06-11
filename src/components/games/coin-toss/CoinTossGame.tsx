'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CoinTossSession, CoinTossRound, CoinSide } from '@/types/coin-toss';
import CoinTossControls from './CoinTossControls';
import CoinAnimation from './CoinAnimation';
import CoinTossResult from './CoinTossResult';
import CoinTossStats from './CoinTossStats';
import CoinTossHistory from './CoinTossHistory';

const CoinTossGame = () => {
    const { user } = useUser();
    const supabase = createClientComponentClient();
    
    const [session, setSession] = useState<CoinTossSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentRound, setCurrentRound] = useState<CoinTossRound | null>(null);
    const [isFlipping, setIsFlipping] = useState(false);
    const [playerBalance, setPlayerBalance] = useState<number>(0);

    // Fetch or create active session on component mount
    useEffect(() => {
        if (user) {
            fetchActiveSession();
        }
    }, [user]);

    // Fetch player's wallet balance
    useEffect(() => {
        if (user) {
            fetchPlayerBalance();
        }
    }, [user]);

    const fetchPlayerBalance = async () => {
        const { data: wallet, error } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', user?.id)
            .single();

        if (error) {
            setError('Error fetching wallet balance');
            return;
        }

        setPlayerBalance(wallet.balance);
    };

    const fetchActiveSession = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Check for existing active session
            const { data: existingSession, error: sessionError } = await supabase
                .from('coin_toss_sessions')
                .select('*')
                .eq('player_id', user?.id)
                .eq('status', 'active')
                .single();

            if (sessionError && sessionError.code !== 'PGRST116') {
                throw sessionError;
            }

            if (existingSession) {
                setSession(existingSession);
            } else {
                // Create new session
                const { data: wallet } = await supabase
                    .from('wallets')
                    .select('balance')
                    .eq('user_id', user?.id)
                    .single();

                const { data: newSession, error: createError } = await supabase
                    .from('coin_toss_sessions')
                    .insert({
                        player_id: user?.id,
                        initial_balance: wallet.balance,
                        total_bets: 0,
                        total_wins: 0,
                        total_losses: 0,
                        net_profit_loss: 0
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                setSession(newSession);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const playRound = async (betAmount: number, choice: CoinSide) => {
        if (!session || isFlipping || betAmount > playerBalance) return;

        setIsFlipping(true);
        setError(null);

        try {
            // Generate result
            const result: CoinSide = Math.random() < 0.5 ? 'heads' : 'tails';
            const isWin = choice === result;
            const payout = isWin ? betAmount * 2 : 0;
            
            // Create round
            const { data: round, error: roundError } = await supabase
                .from('coin_toss_rounds')
                .insert({
                    session_id: session.id,
                    bet_amount: betAmount,
                    player_choice: choice,
                    result,
                    is_win: isWin,
                    payout_amount: payout,
                    player_balance_before: playerBalance,
                    player_balance_after: playerBalance - betAmount + payout
                })
                .select()
                .single();

            if (roundError) throw roundError;

            // Update wallet balance
            const { error: walletError } = await supabase
                .from('wallets')
                .update({ balance: round.player_balance_after })
                .eq('user_id', user?.id);

            if (walletError) throw walletError;

            // Update session stats
            const { error: sessionError } = await supabase
                .from('coin_toss_sessions')
                .update({
                    total_bets: session.total_bets + 1,
                    total_wins: session.total_wins + (isWin ? 1 : 0),
                    total_losses: session.total_losses + (isWin ? 0 : 1),
                    net_profit_loss: session.net_profit_loss + (isWin ? betAmount : -betAmount)
                })
                .eq('id', session.id);

            if (sessionError) throw sessionError;

            setCurrentRound(round);
            setPlayerBalance(round.player_balance_after);
            
            // Update local session state
            setSession(prev => prev ? {
                ...prev,
                total_bets: prev.total_bets + 1,
                total_wins: prev.total_wins + (isWin ? 1 : 0),
                total_losses: prev.total_losses + (isWin ? 0 : 1),
                net_profit_loss: prev.net_profit_loss + (isWin ? betAmount : -betAmount)
            } : null);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setTimeout(() => {
                setIsFlipping(false);
            }, 1500); // Match this with animation duration
        }
    };

    const endSession = async () => {
        if (!session) return;

        try {
            const { error } = await supabase
                .from('coin_toss_sessions')
                .update({
                    status: 'completed',
                    end_time: new Date().toISOString(),
                    final_balance: playerBalance
                })
                .eq('id', session.id);

            if (error) throw error;
            
            // Start new session
            fetchActiveSession();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 p-4">{error}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Coin Toss</h1>
                <div className="text-lg">
                    Balance: ${playerBalance.toFixed(2)}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <CoinAnimation 
                        isFlipping={isFlipping} 
                        result={currentRound?.result} 
                    />
                    <CoinTossControls 
                        onPlay={playRound}
                        disabled={isFlipping}
                        maxBet={playerBalance}
                    />
                    {currentRound && (
                        <CoinTossResult round={currentRound} />
                    )}
                </div>

                <div className="space-y-6">
                    {session && (
                        <>
                            <CoinTossStats session={session} />
                            <CoinTossHistory sessionId={session.id} />
                            <button
                                onClick={endSession}
                                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
                            >
                                End Session
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoinTossGame; 