'use client'

import { createBrowserClient } from '@supabase/ssr'
import { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'

const SupabaseContext = createContext<{
  supabase: ReturnType<typeof createBrowserClient>
  session: Session | null
} | null>(null)

export function SupabaseProvider({ 
  children, 
  session 
}: { 
  children: React.ReactNode
  session: Session | null 
}) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  useEffect(() => {
    console.log('=== SUPABASE PROVIDER DEBUG ===')
    console.log('Session:', session)
    console.log('Session user:', session?.user)
    console.log('Session valid:', !!session)
    console.log('Supabase client created:', !!supabase)
    console.log('=== END SUPABASE PROVIDER DEBUG ===')
  }, [session, supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 