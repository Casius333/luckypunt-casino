'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import AuthModal, { switchTab } from './AuthModal'
import UserMenu from './UserMenu'
import { showModal } from './ModalContainer'
import { useWallet } from '@/hooks/useWallet'

export default function Header() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<User | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { wallet } = useWallet()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = () => {
    setShowAuthModal(true)
    setTimeout(() => switchTab('signin'), 0)
  }

  const handleRegister = () => {
    setShowAuthModal(true)
    setTimeout(() => switchTab('signup'), 0)
  }

  const handleCashierClick = () => {
    showModal('cashier')
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-40 bg-black z-[150]">
        <div className="h-full flex items-center justify-between px-8">
          <div className="flex-1" />
          <div className="flex items-center justify-center flex-1">
            <Link href="/" className="flex items-center">
              <div className="w-[600px] h-[150px] relative">
                <Image
                  src="/images/logo.png"
                  alt="LUCKYPUNT.NET"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4 flex-1 justify-end">
            {user ? (
              <>
                <button
                  onClick={handleCashierClick}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="font-medium">${wallet?.balance?.toFixed(2) || '0.00'}</span>
                  <span className="text-sm text-gray-400">AUD</span>
                </button>
                <UserMenu onCashierClick={handleCashierClick} />
              </>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  className="text-white hover:text-purple-400 transition-colors"
                >
                  Sign In
                </button>

                <button
                  onClick={handleRegister}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
} 