'use client'

import { useState } from 'react'
import { processDeposit, processWithdrawal } from '@/lib/wallet'
import { useRouter } from 'next/navigation'

export default function CashierPage() {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const router = useRouter()

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid amount')
      }

      if (activeTab === 'deposit') {
        await processDeposit('user_id', numAmount, 'AUD', 'credit_card')
      } else {
        await processWithdrawal('user_id', numAmount, 'AUD', 'bank_transfer')
      }

      router.refresh()
      setAmount('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white/5 rounded-lg p-6">
        <div className="flex mb-6">
          <button
            className={`flex-1 py-2 text-center rounded-l-lg ${
              activeTab === 'deposit'
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-gray-400'
            }`}
            onClick={() => setActiveTab('deposit')}
          >
            Deposit
          </button>
          <button
            className={`flex-1 py-2 text-center rounded-r-lg ${
              activeTab === 'withdraw'
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-gray-400'
            }`}
            onClick={() => setActiveTab('withdraw')}
          >
            Withdraw
          </button>
        </div>

        <form onSubmit={handleTransaction} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Amount (AUD)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
              placeholder="Enter amount"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : activeTab === 'deposit' ? 'Deposit' : 'Withdraw'}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-400">
          <h3 className="font-medium text-white mb-2">Important Information:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Minimum {activeTab}: $10</li>
            <li>Maximum {activeTab}: $10,000</li>
            <li>Processing time: Instant for deposits, 1-3 business days for withdrawals</li>
            <li>Please ensure all details are correct before submitting</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 