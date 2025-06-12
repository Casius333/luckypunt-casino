import { CoinSide, CoinTossRound } from './coin-toss';

export interface CoinAnimationProps {
    isFlipping: boolean;
    result?: CoinSide;
}

export interface CoinTossControlsProps {
    onPlay: (betAmount: number, choice: CoinSide) => void;
    disabled: boolean;
    maxBet: number;
}

export interface CoinTossResultProps {
    round: CoinTossRound;
}

export interface CoinTossStatsProps {
    // Add any props if needed
}

export interface CoinTossHistoryProps {
    // Add any props if needed
} 