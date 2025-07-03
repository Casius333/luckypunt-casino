'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CoinTossGame from '@/components/games/coin-toss/CoinTossGame';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

export default function CoinTossPage() {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        // Debug session state
        if (process.env.NODE_ENV === 'development') {
            console.log('=== COIN TOSS PAGE DEBUG ===');
            console.log('User:', user);
            console.log('Loading:', loading);
            console.log('=== END COIN TOSS PAGE DEBUG ===');
        }

        // Redirect if not authenticated after loading is complete
        if (!loading && !user) {
            toast.error('Please sign in to play Coin Toss');
            router.push('/');
        }
    }, [user, loading, router]);

    // Show loading while authentication is being determined
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div>Loading...</div>
            </div>
        );
    }

    // Show nothing while redirecting (user is null but not loading)
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div>Redirecting...</div>
            </div>
        );
    }

    // Show the game if user is authenticated
    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-8">
            <div className="w-full max-w-4xl px-4">
                <CoinTossGame />
            </div>
        </div>
    );
} 