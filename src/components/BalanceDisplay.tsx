'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface DatabaseWallet {
  id: string
  user_id: string
  balance: number
  currency: string
  created_at: string
}

export default function BalanceDisplay() {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) {
          console.error('Auth error:', authError)
          return
        }
        if (!user) {
          console.log('No user found')
          return
        }

        console.log('Fetching balance for user:', user.id)
        const { data, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single()

        if (walletError) {
          console.error('Wallet fetch error:', walletError)
          return
        }

        if (data) {
          console.log('Initial balance:', data.balance)
          setBalance(data.balance)
        }

        // Clean up any existing subscription
        if (channelRef.current) {
          console.log('Cleaning up existing subscription')
          channelRef.current.unsubscribe()
          channelRef.current = null
        }

        // Set up new subscription
        console.log('Setting up new subscription for user:', user.id)
        const channel = supabase
          .channel(`balance_updates_${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'wallets',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('Received wallet update:', payload)
              const newWallet = payload.new as DatabaseWallet
              if (newWallet && typeof newWallet.balance === 'number') {
                console.log('Setting new balance:', newWallet.balance)
                setBalance(newWallet.balance)
                // Force a UI refresh
                router.refresh()
              }
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status)
          })

        channelRef.current = channel
      } catch (error) {
        console.error('Error in fetchBalance:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log('Cleaning up subscription on unmount')
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [supabase, router]) // Only re-run if supabase client changes

  if (loading) return null

  // Log balance before rendering
  console.log('=== BALANCE DISPLAY RENDERING DEBUG ===')
  console.log('Balance state value:', balance)
  console.log('Balance type:', typeof balance)
  console.log('Formatted balance:', balance?.toFixed(2) || '0.00')
  console.log('=== END BALANCE DISPLAY RENDERING DEBUG ===')

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400">Balance:</span>
      <span className="font-medium">
        ${balance?.toFixed(2) || '0.00'}
      </span>
    </div>
  )
} 