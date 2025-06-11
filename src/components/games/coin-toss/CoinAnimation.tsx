'use client';

import { CoinSide } from '@/types/coin-toss';
import { useEffect, useState } from 'react';

interface CoinAnimationProps {
    isFlipping: boolean;
    result?: CoinSide;
}

const CoinAnimation = ({ isFlipping, result }: CoinAnimationProps) => {
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        if (isFlipping) {
            setShowResult(false);
        } else {
            // Show result after animation
            const timer = setTimeout(() => {
                setShowResult(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isFlipping]);

    return (
        <div className="relative w-48 h-48 mx-auto">
            <div
                className={`w-full h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300 shadow-lg
                    ${isFlipping ? 'animate-coin-flip' : ''} 
                    ${!isFlipping && showResult ? 'scale-100' : 'scale-90'}
                    transition-transform duration-300`}
            >
                <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-yellow-800">
                    {!isFlipping && showResult && result ? (
                        result.charAt(0).toUpperCase() + result.slice(1)
                    ) : (
                        '?'
                    )}
                </div>
            </div>
            <style jsx>{`
                @keyframes coin-flip {
                    0% { transform: rotateY(0deg) scale(1); }
                    50% { transform: rotateY(900deg) scale(1.2); }
                    100% { transform: rotateY(1800deg) scale(1); }
                }
                .animate-coin-flip {
                    animation: coin-flip 1.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default CoinAnimation; 