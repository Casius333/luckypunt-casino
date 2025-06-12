'use client';

import { useEffect, useState } from 'react';
import { CoinAnimationProps } from '@/types/components';

const CoinAnimation = ({ isFlipping, result }: CoinAnimationProps) => {
    const [showResult, setShowResult] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isFlipping) {
            setShowResult(false);
            setIsAnimating(true);
            // Animation duration matches CSS animation
            const animationTimer = setTimeout(() => {
                setIsAnimating(false);
            }, 1500); // Match the CSS animation duration

            return () => clearTimeout(animationTimer);
        } else if (!isFlipping && result) {
            // Show result after animation completes
            const resultTimer = setTimeout(() => {
                setShowResult(true);
            }, 100);
            return () => clearTimeout(resultTimer);
        }
    }, [isFlipping, result]);

    return (
        <div className="relative w-48 h-48 mx-auto">
            <div
                className={`w-full h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300 shadow-lg
                    ${isAnimating ? 'animate-coin-flip' : ''} 
                    ${!isAnimating && showResult ? 'scale-100' : 'scale-90'}
                    transition-transform duration-300`}
            >
                <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-yellow-800">
                    {!isAnimating && showResult && result ? (
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