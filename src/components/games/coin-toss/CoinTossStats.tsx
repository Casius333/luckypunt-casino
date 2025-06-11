'use client';

import { CoinTossSession } from '@/types/coin-toss';

interface CoinTossStatsProps {
    session: CoinTossSession;
}

const CoinTossStats = ({ session }: CoinTossStatsProps) => {
    const winRate = session.total_bets > 0
        ? (session.total_wins / session.total_bets) * 100
        : 0;

    return (
        <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Session Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-sm text-gray-400">Total Bets</div>
                    <div className="text-xl font-semibold">{session.total_bets}</div>
                </div>
                <div>
                    <div className="text-sm text-gray-400">Win Rate</div>
                    <div className="text-xl font-semibold">{winRate.toFixed(1)}%</div>
                </div>
                <div>
                    <div className="text-sm text-gray-400">Wins</div>
                    <div className="text-xl font-semibold text-green-500">{session.total_wins}</div>
                </div>
                <div>
                    <div className="text-sm text-gray-400">Losses</div>
                    <div className="text-xl font-semibold text-red-500">{session.total_losses}</div>
                </div>
                <div className="col-span-2">
                    <div className="text-sm text-gray-400">Net Profit/Loss</div>
                    <div className={`text-xl font-semibold ${
                        session.net_profit_loss >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                        ${session.net_profit_loss.toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoinTossStats; 