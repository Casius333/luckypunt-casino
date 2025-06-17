'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/auth-helpers-nextjs';
import { getSupabaseClient } from '@/lib/supabaseClient';

export const useUser = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClientComponentClient();

    // Helper to force logout state
    const forceLogout = () => {
        setUser(null);
        setIsLoading(false);
    };

    useEffect(() => {
        const supabase = getSupabaseClient();

        // Defensive check: if getSession() returns null, treat as logged out
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) {
                console.error('Error fetching session:', error);
                setUser(null);
                setIsLoading(false);
                return;
            }
            if (!data.session) {
                console.log('No valid session found, treating as logged out.');
                setUser(null);
                setIsLoading(false);
                // Clear stale state from localStorage
                localStorage.removeItem('supabase-session');
                return;
            }
            setUser(data.session.user);
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem('supabase-session');
            } else if (session) {
                setUser(session.user);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return { user, isLoading, forceLogout };
};

export default useUser; 