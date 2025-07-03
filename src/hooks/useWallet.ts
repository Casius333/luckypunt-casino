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
    locked_balance: number;
    bonus_balance: number;
    currency: string;
    last_updated: string;
    updated_at: string;
}

export function useWallet() {
    const { user } = useUser();
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    // Log user changes only when they actually change
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🛠️ useWallet: User changed to:', user ? `ID: ${user.id}` : 'null');
        }
    }, [user?.id]);

    // Log wallet state changes only when they actually change
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🛠️ useWallet: Wallet state changed:', {
                wallet: wallet ? { id: wallet.id, balance: wallet.balance, locked_balance: wallet.locked_balance, bonus_balance: wallet.bonus_balance } : null,
                loading,
                error
            });
        }
    }, [wallet?.id, wallet?.balance, wallet?.bonus_balance, loading, error]);

    const fetchWallet = useCallback(async () => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🔄 useWallet: Fetching wallet for user:', user?.id);
        }
        
        // Early return if no user - prevent premature queries
        if (!user) {
            if (process.env.NODE_ENV === 'development') {
                console.log('❌ useWallet: No user, setting wallet to null');
            }
            setWallet(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('wallets')
                .select('id, user_id, balance, locked_balance, bonus_balance, currency, last_updated, updated_at')
                .eq('user_id', user.id)
                .single();

            if (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('❌ useWallet: Fetch error:', error.message, error.code);
                }
                
                if (error.code === 'PGRST116') {
                    // No wallet found, which might be a valid state for a new user
                    if (process.env.NODE_ENV === 'development') {
                        console.log('⚠️ useWallet: No wallet found (PGRST116), setting wallet to null');
                    }
                    setWallet(null);
                } else {
                    setError(error.message);
                }
            } else {
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ useWallet: Wallet fetched successfully:', {
                        id: data?.id,
                        balance: data?.balance,
                        locked_balance: data?.locked_balance,
                        bonus_balance: data?.bonus_balance
                    });
                }
                setWallet(data);
            }
        } catch (e: any) {
            if (process.env.NODE_ENV === 'development') {
                console.error('💥 useWallet: Fetch exception:', e.message);
            }
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
                    if (process.env.NODE_ENV === 'development') {
                        console.log('🔄 useWallet: Real-time update received:', payload.new);
                    }
                    const newWallet = payload.new as Wallet;
                    if (newWallet) {
                        setWallet(newWallet);
                    }
                }
            )
            .subscribe((status) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('🔄 useWallet: Subscription status:', status);
                }
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

    // Return early if no user, but AFTER all hooks have been called
    if (!user) {
        if (process.env.NODE_ENV === 'development') {
            console.log('🛠️ useWallet: No user, returning early');
        }
        return { wallet: null, loading: false, error: null, refetch: () => {} };
    }

    return { wallet, loading, error, refetch: fetchWallet };
} 