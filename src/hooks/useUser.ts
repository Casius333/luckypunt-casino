'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Create a single instance of the supabase client for the hook
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // Get initial session
        async function getInitialSession() {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (process.env.NODE_ENV === 'development') {
                    console.log('=== USEUSER INITIAL SESSION ===');
                    console.log('Session:', session);
                    console.log('Error:', error);
                    console.log('User:', session?.user);
                    console.log('=== END USEUSER INITIAL SESSION ===');
                }

                if (mounted) {
                    setUser(session?.user ?? null);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error getting initial session:', error);
                if (mounted) {
                    setUser(null);
                    setLoading(false);
                }
            }
        }

        getInitialSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: string, session: any) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('=== USEUSER AUTH STATE CHANGE ===');
                    console.log('Event:', event);
                    console.log('New session:', session ? `User: ${session.user?.email}` : 'No session');
                    console.log('=== END USEUSER AUTH STATE CHANGE ===');
                }
                
                if (mounted) {
                    setUser(session?.user ?? null);
                    setLoading(false);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []); // No dependencies needed

    // Log user state changes only when they actually change
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('=== USEUSER HOOK DEBUG ===')
            console.log('Current user state:', user ? `User: ${user.email}` : 'No user')
            console.log('User valid:', !!user)
            console.log('Loading state:', loading)
            console.log('=== END USEUSER HOOK DEBUG ===')
        }
    }, [user?.id, loading]);

    return { user, loading };
}

export default useUser; 