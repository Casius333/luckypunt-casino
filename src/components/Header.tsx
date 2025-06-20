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
import { useUser } from '@/hooks/useUser'
import ClientOnly from './ClientOnly'

export default function Header() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user, loading } = useUser()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { wallet } = useWallet()

  // Show a warning if running on an IP address or HTTP
  const isIpOrHttp = typeof window !== 'undefined' &&
    (/^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname) || window.location.protocol !== 'https:');

  // Log every render for confirmation
  console.log("[UI] Rendered with user:", user, "loading:", loading);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      // setUser(user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session) => {
      // setUser(session?.user ?? null)
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

  // Defensive: never render logged-in UI unless user !== null and loading === false
  if (loading) {
    return <div>Loading...</div>;
  }

  if (user === null) {
    // Always show logged-out UI if user is null and loading is false
    return (
      <>
        <ClientOnly>
          {isIpOrHttp && (
            <div className="w-full bg-yellow-600 text-white text-center py-2 text-xs z-[200]">
              Warning: You are running on an IP address or non-HTTPS. Login and wallet may not work properly on some devices/browsers. Use a real domain and HTTPS for production.
            </div>
          )}
        </ClientOnly>
        {/* Mobile Header */}
        <header className="sticky top-0 z-[150] bg-black flex sm:hidden justify-between items-center px-4 py-2 h-16">
          <Link href="/" className="flex items-center">
            <div className="w-[120px] h-[32px] relative">
              <Image
                src="/images/Logo.png"
                alt="LUCKYPUNT.NET"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignIn}
              className="text-white hover:text-purple-400 transition-colors text-sm md:text-base min-w-[44px] min-h-[44px]"
            >
              Sign In
            </button>

            <button
              onClick={handleRegister}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors text-sm md:text-base min-w-[44px] min-h-[44px]"
            >
              Register
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="fixed top-0 left-0 right-0 bg-black z-[150] h-28 md:h-40 hidden sm:flex">
          <div className="h-full flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-2 md:py-0 w-full">
            <div className="flex-1 hidden md:block" />
            <div className="flex items-center justify-center flex-1 w-full md:w-auto">
              <Link href="/" className="flex items-center">
                <div className="w-[180px] h-[48px] md:w-[600px] md:h-[150px] relative">
                  <Image
                    src="/images/Logo.png"
                    alt="LUCKYPUNT.NET"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end w-full md:w-auto mt-2 md:mt-0">
              <button
                onClick={handleSignIn}
                className="text-white hover:text-purple-400 transition-colors text-sm md:text-base min-w-[44px] min-h-[44px]"
              >
                Sign In
              </button>

              <button
                onClick={handleRegister}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors text-sm md:text-base min-w-[44px] min-h-[44px]"
              >
                Register
              </button>
            </div>
          </div>
        </header>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // Only here if user !== null and loading === false
  return (
    <>
      <ClientOnly>
        {isIpOrHttp && (
          <div className="w-full bg-yellow-600 text-white text-center py-2 text-xs z-[200]">
            Warning: You are running on an IP address or non-HTTPS. Login and wallet may not work properly on some devices/browsers. Use a real domain and HTTPS for production.
          </div>
        )}
      </ClientOnly>
      {/* Mobile Header */}
      <header className="sticky top-0 z-[150] bg-black flex sm:hidden justify-between items-center px-4 py-2 h-16">
        <Link href="/" className="flex items-center">
          <div className="w-[120px] h-[32px] relative">
            <Image
              src="/images/Logo.png"
              alt="LUCKYPUNT.NET"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCashierClick}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm min-w-[44px] min-h-[44px]"
          >
            <span className="font-medium">${wallet?.balance?.toFixed(2) || '0.00'}</span>
          </button>
          <UserMenu onCashierClick={handleCashierClick} />
        </div>
      </header>

      {/* Desktop Header */}
      <header className="fixed top-0 left-0 right-0 bg-black z-[150] h-28 md:h-40 hidden sm:flex">
        <div className="h-full flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-2 md:py-0 w-full">
          <div className="flex-1 hidden md:block" />
          <div className="flex items-center justify-center flex-1 w-full md:w-auto">
            <Link href="/" className="flex items-center">
              <div className="w-[180px] h-[48px] md:w-[600px] md:h-[150px] relative">
                <Image
                  src="/images/Logo.png"
                  alt="LUCKYPUNT.NET"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end w-full md:w-auto mt-2 md:mt-0">
            <button
              onClick={handleCashierClick}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 md:px-4 py-2 rounded-lg transition-colors cursor-pointer text-sm md:text-base min-w-[44px] min-h-[44px]"
            >
              <span className="font-medium">${wallet?.balance?.toFixed(2) || '0.00'}</span>
            </button>
            <UserMenu onCashierClick={handleCashierClick} />
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