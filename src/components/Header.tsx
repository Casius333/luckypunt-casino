'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import BalanceDisplay from './BalanceDisplay'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/auth-helpers-nextjs'
import { Menu, X } from 'lucide-react'
import { showModal } from './ModalContainer'
import { switchTab } from './AuthModal'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const handleAuthClick = (tab: 'signin' | 'signup') => {
    showModal('auth');
    switchTab(tab);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    setIsMenuOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-[150] bg-black">
      <div className="flex items-center justify-between h-24 px-4 max-w-[1920px] mx-auto">
        {/* Empty left section to maintain spacing */}
        <div className="w-[200px]" />

        {/* Center section - Logo */}
        <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 text-4xl font-bold text-white">
          LUCKYPUNT.NET
        </Link>

        {/* Right section - Auth buttons or User Menu */}
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
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Menu size={24} className="text-white" />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-black border border-white/10 rounded-lg shadow-xl py-1 z-50">
                    <Link
                      href="/"
                      className="block px-4 py-2 text-white hover:bg-white/10 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Home
                    </Link>
                    <button
                      onClick={() => {
                        showModal('cashier')
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors"
                    >
                      Cashier
                    </button>
                    <Link
                      href="/promotions"
                      className="block px-4 py-2 text-white hover:bg-white/10 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Promotions
                    </Link>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-white hover:bg-white/10 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/vip"
                      className="block px-4 py-2 text-white hover:bg-white/10 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      VIP
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
} 