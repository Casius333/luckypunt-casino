'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RealtimeChannel } from '@supabase/supabase-js'

interface CashierModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface DatabaseWallet {
  id: string
  user_id: string
  balance: number
  currency: string
  created_at: string
}

export default function CashierModal({ isOpen, onClose, onSuccess }: CashierModalProps) {
  const [amount, setAmount] = useState('')
  const [isDeposit, setIsDeposit] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const fetchBalance = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          console.error('Auth error:', authError)
          return
        }

        // Initial balance fetch
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single()

        if (walletError) {
          console.error('Wallet fetch error:', walletError)
          return
        }

        if (wallet) {
          console.log('Setting initial balance:', wallet.balance)
          setBalance(wallet.balance)
        }

        // Clean up any existing subscription
        if (channelRef.current) {
          console.log('Cleaning up existing subscription')
          channelRef.current.unsubscribe()
          channelRef.current = null
        }

        // Set up real-time subscription
        console.log('Setting up new subscription for user:', user.id)
        const channel = supabase
          .channel(`wallet_changes_${user.id}`)
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
      }
    }

    fetchBalance()

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up subscription on unmount')
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [isOpen, supabase, router])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid amount')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in first')

      // For deposits, use the test deposit endpoint
      if (isDeposit) {
        console.log('Attempting test deposit:', { amount: numAmount })
        const response = await fetch('/api/wallet/test-deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: numAmount })
        })

        const data = await response.json()
        console.log('Deposit response:', data)
        
        if (!response.ok) {
          throw new Error(data.error || 'Deposit failed')
        }

        toast.success('Test deposit successful!')
      } else {
        // For withdrawals, use the test withdraw endpoint
        console.log('Attempting test withdrawal:', { amount: numAmount })
        const response = await fetch('/api/wallet/test-withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: numAmount })
        })

        const data = await response.json()
        console.log('Withdrawal response:', data)
        
        if (!response.ok) {
          throw new Error(data.error || 'Withdrawal failed')
        }

        toast.success('Test withdrawal successful!')
      }

      setAmount('')
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Transaction error:', error)
      toast.error(error instanceof Error ? error.message : 'Transaction failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-black border border-white/10 rounded-lg shadow-xl p-6 mx-4">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-white/10">
          <button
            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
              isDeposit ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setIsDeposit(true)}
            disabled={isLoading}
          >
            Test Deposit
            {isDeposit && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
            )}
          </button>
          <button
            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
              !isDeposit ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setIsDeposit(false)}
            disabled={isLoading}
          >
            Test Withdraw
            {!isDeposit && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
            )}
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-gray-400">Current Balance:</div>
            <div className="font-medium">${balance?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="flex gap-2 mb-4">
            <button
              className={`flex-1 py-2 px-4 rounded ${
                isDeposit ? 'bg-green-600' : 'bg-gray-700'
              }`}
              onClick={() => setIsDeposit(true)}
            >
              Deposit
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded ${
                !isDeposit ? 'bg-red-600' : 'bg-gray-700'
              }`}
              onClick={() => setIsDeposit(false)}
            >
              Withdraw
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-white"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !amount}
          >
            {isLoading ? 'Processing...' : (isDeposit ? 'Make Test Deposit' : 'Make Test Withdrawal')}
          </button>
        </form>
      </div>
    </div>
  )
} 