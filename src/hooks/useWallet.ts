'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from './useUser';

const supabase = createClient();

export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    bonus_balance: number;
    created_at: string;
    updated_at: string;
}

export function useWallet() {
    const { user } = useUser();
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWallet = useCallback(async () => {
        if (!user) {
            setWallet(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No wallet found, which might be a valid state for a new user
                    setWallet(null);
                } else {
                    setError(error.message);
                }
            } else {
                setWallet(data);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet]);

    return { wallet, loading, error, refetch: fetchWallet };
} 