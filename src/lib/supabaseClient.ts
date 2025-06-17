import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

const SESSION_KEY = 'supabase-session';

export function getSupabaseClient() {
  const supabase = createBrowserSupabaseClient({
    cookieOptions: {
      name: 'sb-auth-token',
      domain: process.env.NEXT_PUBLIC_ENV === 'staging' || process.env.NODE_ENV === 'production'
        ? '.luckypunt.net'
        : undefined,
      sameSite: 'lax',
      secure: true,
      path: '/',
    },
  });

  // Only run fallback logic on the client
  if (typeof window !== 'undefined') {
    // Helper to validate session structure
    function isValidSession(obj: any) {
      return obj && typeof obj === 'object' && obj.access_token && obj.refresh_token && obj.user;
    }

    // Try to restore session from localStorage if getSession() returns null
    supabase.auth.getSession().then(async ({ data, error }) => {
      console.log('🟢 [Supabase] getSession:', data, error);
      if (!data.session) {
        // Try to restore from localStorage
        const localSessionRaw = localStorage.getItem(SESSION_KEY);
        if (localSessionRaw) {
          try {
            const localSession = JSON.parse(localSessionRaw);
            if (isValidSession(localSession)) {
              console.log('🟡 [Supabase] Restoring session from localStorage:', localSession);
              const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession(localSession);
              console.log('🟡 [Supabase] setSession result:', setSessionData, setSessionError);
            } else {
              console.warn('⚠️ [Supabase] Invalid session structure in localStorage, clearing.');
              localStorage.removeItem(SESSION_KEY);
            }
          } catch (e) {
            console.error('❌ [Supabase] Failed to parse session from localStorage:', e);
            localStorage.removeItem(SESSION_KEY);
          }
        } else {
          console.log('🟡 [Supabase] No session in localStorage.');
        }
      }
    });

    // Listen for auth state changes to store session in localStorage
    supabase.auth.onAuthStateChange((event, session) => {
      if (session && isValidSession(session)) {
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          console.log('✅ [Supabase] Session saved to localStorage.');
        } catch (e) {
          console.error('❌ [Supabase] Failed to save session to localStorage:', e);
        }
      } else if (!session) {
        localStorage.removeItem(SESSION_KEY);
        console.log('🧹 [Supabase] Session removed from localStorage.');
      }
    });
  }

  return supabase;
} 