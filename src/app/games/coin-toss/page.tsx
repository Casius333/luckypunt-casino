import CoinTossGame from '@/components/games/coin-toss/CoinTossGame';

export const metadata = {
    title: 'Coin Toss - LuckyPunt Casino',
    description: 'Play Coin Toss at LuckyPunt Casino - Double your money or lose it all!',
};

export default function CoinTossPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <CoinTossGame />
        </div>
    );
} 