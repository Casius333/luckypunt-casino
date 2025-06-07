'use client'

import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

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
  const supabase = createClientComponentClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // Initial fetch of balance
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
          .channel('wallet_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'wallets',
              filter: `user_id=eq.${user.id}`
            },
            (payload: RealtimePostgresChangesPayload<DatabaseWallet>) => {
              console.log('Received wallet update:', payload)
              const newWallet = payload.new as DatabaseWallet | null
              if (newWallet && typeof newWallet.balance === 'number') {
                console.log('Setting new balance:', newWallet.balance)
                setBalance(newWallet.balance)
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
  }, [supabase]) // Only re-run if supabase client changes

  if (loading) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400">Balance:</span>
      <span className="font-medium">
        ${balance?.toFixed(2) || '0.00'}
      </span>
    </div>
  )
} 