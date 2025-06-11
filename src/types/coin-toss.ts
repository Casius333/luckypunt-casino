export type CoinSide = 'heads' | 'tails';

export interface CoinTossSession {
    id: string;
    player_id: string;
    start_time: string;
    end_time: string | null;
    initial_balance: number;
    final_balance: number | null;
    total_bets: number;
    total_wins: number;
    total_losses: number;
    net_profit_loss: number;
    status: 'active' | 'completed';
    created_at: string;
    updated_at: string;
}

export interface CoinTossRound {
    id: string;
    session_id: string;
    bet_amount: number;
    player_choice: CoinSide;
    result: CoinSide;
    is_win: boolean;
    payout_amount: number;
    player_balance_before: number;
    player_balance_after: number;
    created_at: string;
}

export interface CoinTossStats {
    totalBets: number;
    totalWins: number;
    totalLosses: number;
    netProfitLoss: number;
    winRate: number;
} 