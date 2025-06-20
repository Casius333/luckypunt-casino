'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestAuthPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    
    // Test session
    supabase.auth.getSession().then(({ data, error }) => {
      console.log('Session test:', { data, error })
      if (error) {
        setError(error.message)
      } else {
        setSession(data.session)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session)
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    })
    if (error) {
      setError(error.message)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Auth Test Page</h1>
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Session Status:</h2>
        <pre className="text-sm">
          {session ? JSON.stringify(session.user, null, 2) : 'No session'}
        </pre>
      </div>

      <div className="space-x-4">
        <button
          onClick={handleSignIn}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Sign In
        </button>
        
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
} 