'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface DatabaseWallet {
  id: string
  user_id: string
  balance: number
  locked_balance: number
  bonus_balance: number
  currency: string
  created_at: string
}

export default function BalanceDisplay() {
  const [balance, setBalance] = useState<number | null>(null)
  const [lockedBalance, setLockedBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Add a manual refresh function
  const refreshBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('wallets')
        .select('balance, locked_balance, bonus_balance')
        .eq('user_id', user.id)
        .single()

      if (data) {
        const totalGamblingFunds = (data.locked_balance && data.locked_balance > 0) 
          ? data.locked_balance 
          : data.balance
        setBalance(totalGamblingFunds)
        setLockedBalance(data.locked_balance || 0)
      }
    } catch (error) {
      console.error('Error refreshing balance:', error)
    }
  }

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
          .select('balance, locked_balance, bonus_balance')
          .eq('user_id', user.id)
          .single()

        if (walletError) {
          console.error('Wallet fetch error:', walletError)
          return
        }

        if (data) {
          console.log('Initial balance:', data.balance)
          console.log('Initial locked balance:', data.locked_balance)
          // Show total gambling funds as main balance
          const totalGamblingFunds = (data.locked_balance && data.locked_balance > 0) 
            ? data.locked_balance 
            : data.balance
          setBalance(totalGamblingFunds)
          setLockedBalance(data.locked_balance || 0)
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
                console.log('Setting new locked balance:', newWallet.locked_balance)
                // Show total gambling funds as main balance
                const totalGamblingFunds = (newWallet.locked_balance && newWallet.locked_balance > 0) 
                  ? newWallet.locked_balance 
                  : newWallet.balance
                setBalance(totalGamblingFunds)
                setLockedBalance(newWallet.locked_balance || 0)
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

    // Set up a refresh interval as backup
    const refreshInterval = setInterval(refreshBalance, 5000) // Refresh every 5 seconds

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log('Cleaning up subscription on unmount')
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      clearInterval(refreshInterval)
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
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-gray-400">Balance:</span>
        <span className="font-medium">
          ${balance?.toFixed(2) || '0.00'}
        </span>
      </div>
      <div className="text-xs text-gray-500 space-y-0.5">
        <div>Available Funds: ${(lockedBalance && lockedBalance > 0) ? '0.00' : (balance?.toFixed(2) || '0.00')}</div>
        <div>Locked Funds: ${lockedBalance?.toFixed(2) || '0.00'}</div>
      </div>
    </div>
  )
} 