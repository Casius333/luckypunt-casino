'use client'

import { useState, useEffect } from 'react'
import { X, DollarSign, CreditCard, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'

interface CashierModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface DatabaseWallet {
  id: string
  user_id: string
  balance: number
  locked_balance: number
  bonus_balance: number
  currency: string
  created_at: string
}

export default function CashierModal({ isOpen, onClose, onSuccess }: CashierModalProps) {
  const [amount, setAmount] = useState('')
  const [isDeposit, setIsDeposit] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [lockedBalance, setLockedBalance] = useState<number | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
          .select('balance, locked_balance, bonus_balance')
          .eq('user_id', user.id)
          .single()

        if (walletError) {
          console.error('Wallet fetch error:', walletError)
          return
        }

        if (wallet) {
          console.log('Setting initial balance:', wallet.balance)
          console.log('Setting initial locked balance:', wallet.locked_balance)
          // Show total gambling funds as main balance
          const totalGamblingFunds = (wallet.locked_balance && wallet.locked_balance > 0) 
            ? wallet.locked_balance 
            : wallet.balance
          setBalance(totalGamblingFunds)
          setLockedBalance(wallet.locked_balance || 0)
        }
      } catch (error) {
        console.error('Error in fetchBalance:', error)
      }
    }

    fetchBalance()
  }, [isOpen, supabase])

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

      if (isDeposit) {
        console.log('Attempting test deposit:', { amount: numAmount })
        const response = await fetch('/api/wallet/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: numAmount })
        })

        const data = await response.json()
        console.log('Deposit response:', data)
        
        if (response.status === 401) {
          toast.error('Session expired. Please sign in again.')
          return
        }

        if (!response.ok) {
          throw new Error(data.error || 'Deposit failed')
        }

        toast.success('Test deposit successful!')
      } else {
        // For withdrawals, use the test withdraw endpoint
        console.log('Attempting test withdrawal:', { amount: numAmount })
        const response = await fetch('/api/wallet/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: numAmount })
        })

        const data = await response.json()
        console.log('Withdrawal response:', data)
        
        if (response.status === 401) {
          toast.error('Session expired. Please sign in again.')
          return
        }

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-x-hidden">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xs sm:max-w-md bg-black border border-white/10 rounded-lg shadow-xl p-4 sm:p-6 mx-2 sm:mx-4 overflow-y-auto">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-2 top-2 sm:right-4 sm:top-4 text-gray-400 hover:text-white transition-colors min-w-[32px] min-h-[32px]"
        >
          <X size={24} />
        </button>

        {/* Tabs */}
        <div className="flex mb-4 sm:mb-6 border-b border-white/10">
          <button
            className={`pb-2 sm:pb-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors relative ${
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
            className={`pb-2 sm:pb-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors relative ${
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

        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-2 sm:mb-4">
            <div className="text-gray-400 text-xs sm:text-base">Current Balance:</div>
            <div className="font-medium text-sm sm:text-base">${balance?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="text-xs text-gray-500 space-y-0.5 mb-2 sm:mb-4">
            <div>Available Funds: ${(lockedBalance && lockedBalance > 0) ? '0.00' : (balance?.toFixed(2) || '0.00')}</div>
            <div>Locked Funds: ${lockedBalance?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="flex gap-2 mb-2 sm:mb-4">
            <button
              className={`flex-1 py-2 px-2 sm:px-4 rounded text-xs sm:text-base ${
                isDeposit ? 'bg-green-600' : 'bg-gray-700'
              }`}
              onClick={() => setIsDeposit(true)}
            >
              Deposit
            </button>
            <button
              className={`flex-1 py-2 px-2 sm:px-4 rounded text-xs sm:text-base ${
                !isDeposit ? 'bg-red-600' : 'bg-gray-700'
              }`}
              onClick={() => setIsDeposit(false)}
            >
              Withdraw
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="amount" className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-base">$</span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-white text-xs sm:text-base"
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
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base min-h-[44px]"
            disabled={isLoading || !amount}
          >
            {isLoading ? 'Processing...' : (isDeposit ? 'Make Test Deposit' : 'Make Test Withdrawal')}
          </button>
        </form>
      </div>
    </div>
  )
} 