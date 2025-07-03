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
  session: initialSession
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

  const [session, setSession] = useState<Session | null>(initialSession)

  useEffect(() => {
    console.log('=== SUPABASE PROVIDER DEBUG ===')
    console.log('Initial session:', initialSession)
    console.log('Current session state:', session)
    console.log('Session valid:', !!session)
    console.log('Supabase client created:', !!supabase)
    console.log('=== END SUPABASE PROVIDER DEBUG ===')

    // Set the initial session
    setSession(initialSession)

    // Manually get the session once to ensure it's initialized
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('=== MANUAL SESSION CHECK ===')
      console.log('Current session from supabase.auth.getSession():', currentSession)
      console.log('=== END MANUAL SESSION CHECK ===')
      setSession(currentSession)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('=== SUPABASE PROVIDER AUTH STATE CHANGE ===')
        console.log('Event:', event)
        console.log('Session:', session)
        console.log('=== END SUPABASE PROVIDER AUTH STATE CHANGE ===')
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, initialSession])

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