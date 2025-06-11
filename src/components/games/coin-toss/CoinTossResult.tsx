'use client';

import { CoinTossRound } from '@/types/coin-toss';

interface CoinTossResultProps {
    round: CoinTossRound;
}

const CoinTossResult = ({ round }: CoinTossResultProps) => {
    return (
        <div className={`p-4 rounded-lg ${
            round.is_win ? 'bg-green-800' : 'bg-red-800'
        }`}>
            <div className="text-center space-y-2">
                <div className="text-xl font-bold">
                    {round.is_win ? 'You Won!' : 'You Lost'}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="text-gray-300">Your Choice</div>
                        <div className="font-semibold">
                            {round.player_choice.charAt(0).toUpperCase() + round.player_choice.slice(1)}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-300">Result</div>
                        <div className="font-semibold">
                            {round.result.charAt(0).toUpperCase() + round.result.slice(1)}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-300">Bet Amount</div>
                        <div className="font-semibold">${round.bet_amount.toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-gray-300">Payout</div>
                        <div className="font-semibold">${round.payout_amount.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoinTossResult; 