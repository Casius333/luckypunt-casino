'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/auth-helpers-nextjs';

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
        const getUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);
                if (!user) {
                    // If no user, force logout state
                    forceLogout();
                }
            } catch (error) {
                console.error('Error getting user:', error);
                forceLogout();
            } finally {
                setIsLoading(false);
            }
        };

        getUser();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                forceLogout();
            }
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return { user, isLoading, forceLogout };
};

export default useUser; 