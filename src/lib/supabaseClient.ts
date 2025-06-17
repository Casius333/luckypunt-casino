import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

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

  // Fallback logic for session restoration
  supabase.auth.getSession().then(async ({ data, error }) => {
    console.log('🟢 [Supabase] getSession:', data, error);
    if (!data.session) {
      // Try to recover session
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('🟡 [Supabase] getUser fallback:', userData, userError);
    }
  });

  return supabase;
} 