import { useState, useEffect, useRef } from 'react';
import { useUser } from './useUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    created_at: string;
    updated_at: string;
}

export function useWallet() {
    const { user } = useUser();
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClientComponentClient();
    const router = useRouter();
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        async function setupWallet() {
            if (!user) {
                setWallet(null);
                setIsLoading(false);
                return;
            }

            try {
                // Initial wallet fetch
                const { data, error } = await supabase
                    .from('wallets')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching wallet:', error);
                    setWallet(null);
                } else {
                    console.log('Initial wallet data:', data);
                    setWallet(data);
                }

                // Clean up any existing subscription
                if (channelRef.current) {
                    console.log('Cleaning up existing wallet subscription');
                    channelRef.current.unsubscribe();
                    channelRef.current = null;
                }

                // Set up real-time subscription
                console.log('Setting up wallet subscription for user:', user.id);
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
                            console.log('Received wallet update:', payload);
                            const newWallet = payload.new as Wallet;
                            setWallet(newWallet);
                            // Force UI refresh
                            router.refresh();
                        }
                    )
                    .subscribe((status) => {
                        console.log('Wallet subscription status:', status);
                    });

                channelRef.current = channel;
            } catch (error) {
                console.error('Error in setupWallet:', error);
            } finally {
                setIsLoading(false);
            }
        }

        setupWallet();

        // Cleanup function
        return () => {
            if (channelRef.current) {
                console.log('Cleaning up wallet subscription');
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }
        };
    }, [user, supabase, router]);

    return { wallet, isLoading };
} 