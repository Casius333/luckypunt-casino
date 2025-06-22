'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useSupabase } from '@/components/SupabaseProvider';

export function useUser() {
    const { supabase, session } = useSupabase();
    const [user, setUser] = useState<User | null>(session?.user ?? null);
    const [loading, setLoading] = useState(!session);

    useEffect(() => {
        // Set initial user from session
        setUser(session?.user ?? null);
        setLoading(!session);

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: string, session: any) => {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [session, supabase.auth]);

    // Log session state changes only when they actually change
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('=== USEUSER HOOK DEBUG ===')
            console.log('Session:', session)
            console.log('Session user:', session?.user)
            console.log('Session valid:', !!session)
            console.log('Current user state:', user)
            console.log('User valid:', !!user)
            console.log('Loading state:', loading)
            console.log('=== END USEUSER HOOK DEBUG ===')
        }
    }, [session?.user?.id, user?.id, loading]);

    return { user, loading };
}

export default useUser; 