'use client';

import Link from 'next/link';
import Image from 'next/image';

const CoinTossTile = () => {
    return (
        <Link href="/games/coin-toss" className="block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <Image
                    src="/images/coin-toss-cover.jpg"
                    alt="Coin Toss Game"
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-xl font-bold text-white">Coin Toss</h3>
                    <p className="text-sm text-gray-300">Double your money or lose it all!</p>
                </div>
            </div>
        </Link>
    );
};

export default CoinTossTile; 