'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from './useUser';
import { RealtimeChannel } from '@supabase/supabase-js';

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
    const channelRef = useRef<RealtimeChannel | null>(null);

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

    // Set up real-time subscription for wallet updates
    useEffect(() => {
        if (!user) {
            // Clean up existing subscription if user is null
            if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }
            return;
        }

        // Clean up any existing subscription
        if (channelRef.current) {
            channelRef.current.unsubscribe();
            channelRef.current = null;
        }

        // Set up new real-time subscription
        const channel = supabase
            .channel(`wallet_updates_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'wallets',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Wallet update received:', payload);
                    const newWallet = payload.new as Wallet;
                    if (newWallet) {
                        setWallet(newWallet);
                    }
                }
            )
            .subscribe((status) => {
                console.log('Wallet subscription status:', status);
            });

        channelRef.current = channel;

        // Cleanup function
        return () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }
        };
    }, [user]);

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet]);

    return { wallet, loading, error, refetch: fetchWallet };
} 