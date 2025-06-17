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
        if (!loading && !user) {
            toast.error('Please sign in to play Coin Toss');
            router.push('/');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div>Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-8">
            <div className="w-full max-w-4xl px-4">
                <CoinTossGame />
            </div>
        </div>
    );
} 