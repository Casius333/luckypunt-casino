'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CoinTossRound } from '@/types/coin-toss';

interface CoinTossHistoryProps {
    sessionId: string;
}

const CoinTossHistory = ({ sessionId }: CoinTossHistoryProps) => {
    const [rounds, setRounds] = useState<CoinTossRound[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClientComponentClient();

    useEffect(() => {
        fetchRounds();
        // Subscribe to new rounds
        const channel = supabase
            .channel('coin_toss_rounds')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'coin_toss_rounds',
                    filter: `session_id=eq.${sessionId}`
                },
                (payload) => {
                    setRounds(prev => [payload.new as CoinTossRound, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId]);

    const fetchRounds = async () => {
        const { data, error } = await supabase
            .from('coin_toss_rounds')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) {
            setRounds(data);
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return <div className="text-center p-4">Loading history...</div>;
    }

    if (rounds.length === 0) {
        return <div className="text-center p-4 text-gray-400">No rounds played yet</div>;
    }

    return (
        <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Recent Rounds</h2>
            <div className="space-y-2">
                {rounds.map((round) => (
                    <div
                        key={round.id}
                        className={`p-3 rounded ${
                            round.is_win ? 'bg-green-900/50' : 'bg-red-900/50'
                        }`}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <div className={`text-sm ${
                                    round.is_win ? 'text-green-400' : 'text-red-400'
                                }`}>
                                    {round.is_win ? 'Won' : 'Lost'}
                                </div>
                                <div className="text-gray-400">•</div>
                                <div className="text-sm">
                                    {round.player_choice.charAt(0).toUpperCase() + round.player_choice.slice(1)}
                                </div>
                                <div className="text-gray-400">→</div>
                                <div className="text-sm">
                                    {round.result.charAt(0).toUpperCase() + round.result.slice(1)}
                                </div>
                            </div>
                            <div className="text-sm">
                                ${round.bet_amount.toFixed(2)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CoinTossHistory; 