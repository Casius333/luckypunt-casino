'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import BalanceDisplay from './BalanceDisplay'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/auth-helpers-nextjs'
import { Menu } from 'lucide-react'
import { showModal } from './ModalContainer'
import { switchTab } from './AuthModal'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [supabase.auth])

  const handleAuthClick = (tab: 'signin' | 'signup') => {
    showModal('auth');
    switchTab(tab);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[150] bg-black">
      <div className="flex items-center justify-between h-24 px-4 max-w-[1920px] mx-auto">
        {/* Empty left section to maintain spacing */}
        <div className="w-[200px]" />

        {/* Center section - Logo */}
        <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 text-4xl font-bold text-white">
          LUCKY PUNT
        </Link>

        {/* Right section - Auth buttons */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <button
                onClick={() => handleAuthClick('signin')}
                className="px-6 py-2 border border-purple-600 text-white rounded-lg hover:bg-purple-600/10 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => handleAuthClick('signup')}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Register
              </button>
            </>
          ) : (
            <>
              <BalanceDisplay />
              <button
                onClick={() => showModal('cashier')}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Cashier
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
} 