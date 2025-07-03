'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

export default function TestBettingPage() {
    const { user, loading } = useUser();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);
    const [balance, setBalance] = useState<number | null>(null);

    // Redirect if not authenticated
    if (!loading && !user) {
        router.push('/');
        return null;
    }

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    // At this point user is guaranteed to exist
    if (!user) {
        return null;
    }

    const testTransaction = async (type: 'lose' | 'win' | 'bigwin') => {
        setIsProcessing(true);
        try {
            // Always create a bet transaction first (this contributes to wagering)
            const betResponse = await fetch('/api/gaming/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'bet',
                    amount: 100,
                    userId: user.id,
                    gameId: 'test-betting-tool'
                })
            });

            const betResult = await betResponse.json();
            
            // Handle different win scenarios
            if (type === 'win') {
                // Regular win: $100 bet + $100 win = break even
                const winResponse = await fetch('/api/gaming/test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'win',
                        amount: 100,
                        userId: user.id,
                        gameId: 'test-betting-tool'
                    })
                });

                const winResult = await winResponse.json();
                setLastResult({
                    bet: betResult,
                    win: winResult,
                    summary: `Bet $100 (wagering: ${betResult.wageringProgress || 0}), Won $100, Net: $0`
                });
            } else if (type === 'bigwin') {
                // Big win: $100 bet + $1000 win = +$900 net
                const winResponse = await fetch('/api/gaming/test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'win',
                        amount: 1000,
                        userId: user.id,
                        gameId: 'test-betting-tool'
                    })
                });

                const winResult = await winResponse.json();
                setLastResult({
                    bet: betResult,
                    win: winResult,
                    summary: `Bet $100 (wagering: ${betResult.wageringProgress || 0}), Won $1000, Net: +$900`
                });
            } else {
                // Lose: just the bet, no win transaction
                setLastResult({
                    bet: betResult,
                    summary: `Bet $100 (wagering: ${betResult.wageringProgress || 0}), Lost $100, Net: -$100`
                });
            }
            
            // Get updated balance
            const balanceResponse = await fetch('/api/gaming/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'balance',
                    userId: user.id,
                    gameId: 'test-betting-tool'
                })
            });
            
            const balanceResult = await balanceResponse.json();
            setBalance(balanceResult.newBalance);
            
        } catch (error) {
            console.error('Transaction failed:', error);
            setLastResult({ success: false, error: 'Transaction failed' });
        } finally {
            setIsProcessing(false);
        }
    };

    const getBalance = async () => {
        try {
            const response = await fetch('/api/gaming/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'balance',
                    userId: user.id,
                    gameId: 'test-betting-tool'
                })
            });
            
            const result = await response.json();
            setBalance(result.newBalance);
            setLastResult(result);
        } catch (error) {
            console.error('Balance check failed:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">Betting Test Tool</h1>
                
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="text-center mb-6">
                        <p className="text-lg mb-4 text-gray-800">User: {user.email}</p>
                        <button
                            onClick={getBalance}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Check Balance
                        </button>
                        {balance !== null && (
                            <p className="text-xl font-semibold mt-2 text-gray-900">
                                Current Balance: ${balance}
                            </p>
                        )}
                    </div>
                    
                    <div className="flex gap-4 justify-center mb-6">
                        <button
                            onClick={() => testTransaction('lose')}
                            disabled={isProcessing}
                            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold"
                        >
                            {isProcessing ? 'Processing...' : 'Lose $100'}
                        </button>
                        
                        <button
                            onClick={() => testTransaction('win')}
                            disabled={isProcessing}
                            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold"
                        >
                            {isProcessing ? 'Processing...' : 'Win $100'}
                        </button>
                        
                        <button
                            onClick={() => testTransaction('bigwin')}
                            disabled={isProcessing}
                            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold"
                        >
                            {isProcessing ? 'Processing...' : 'Win $1000'}
                        </button>
                    </div>
                    
                    {lastResult && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2 text-gray-900">Last Transaction Result:</h3>
                            <pre className="text-sm bg-white border p-3 rounded overflow-auto text-gray-900">
                                {JSON.stringify(lastResult, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">What This Tests:</h2>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li>• <strong className="text-gray-900">Lose $100:</strong> Simulates placing a $100 bet that you lose (contributes to wagering)</li>
                        <li>• <strong className="text-gray-900">Win $100:</strong> Simulates placing a $100 bet that you win (contributes to wagering + adds $100 payout)</li>
                        <li>• <strong className="text-gray-900">Win $1000:</strong> Simulates placing a $100 bet with a big $1000 win (contributes $100 to wagering + adds $1000 payout = +$900 net)</li>
                        <li>• <strong className="text-gray-900">Balance Updates:</strong> Checks that wallet changes are applied correctly</li>
                        <li>• <strong className="text-gray-900">Wagering Progress:</strong> All buttons contribute $100 to promotion wagering requirements</li>
                        <li>• <strong className="text-gray-900">Locked Balance:</strong> Monitors bonus balance and wagering progress</li>
                    </ul>
                </div>
            </div>
        </div>
    );
} 