'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface CashierModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CashierModal({ isOpen, onClose, onSuccess }: CashierModalProps) {
  const [amount, setAmount] = useState('')
  const [isDeposit, setIsDeposit] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid amount')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in first')

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: isDeposit ? numAmount : -numAmount,
          type: isDeposit ? 'deposit' : 'withdraw',
          status: 'pending'
        })

      if (error) throw error

      toast.success(`${isDeposit ? 'Deposit' : 'Withdrawal'} request submitted!`)
      onSuccess()
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
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
          >
            Deposit
            {isDeposit && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
            )}
          </button>
          <button
            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
              !isDeposit ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setIsDeposit(false)}
          >
            Withdraw
            {!isDeposit && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
            )}
          </button>
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
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {isDeposit ? 'Deposit' : 'Withdraw'}
          </button>
        </form>
      </div>
    </div>
  )
} 