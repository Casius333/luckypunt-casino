'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import AuthModal, { switchTab } from './AuthModal'
import UserMenu from './UserMenu'
import { showModal } from './ModalContainer'
import { useWallet } from '@/hooks/useWallet'
import { useUser } from '@/hooks/useUser'
import ClientOnly from './ClientOnly'
import AuthButton from './AuthButton'
import { Button } from './ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu'
import { Menu } from 'lucide-react'

export default function Header() {
  const router = useRouter()
  const { user, loading } = useUser()
  const { wallet } = useWallet()
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // Check if running on IP or non-HTTPS
  const isIpOrHttp = typeof window !== 'undefined' && 
    (window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/) || 
     window.location.protocol === 'http:')

  // Log user state changes only when they actually change
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("[UI] Header: User state changed:", {
        user: user ? { id: user.id, email: user.email } : null,
        loading
      });
    }
  }, [user?.id, loading]);

  // Calculate total gambling funds (same logic as CashierModal)
  const getTotalGamblingFunds = () => {
    if (!wallet) return 0
    return (wallet.locked_balance && wallet.locked_balance > 0) 
      ? wallet.locked_balance 
      : wallet.balance
  }

  // Log wallet state changes only when they actually change
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== HEADER WALLET DEBUG ===')
      console.log('User authenticated:', !!user && !loading)
      console.log('Wallet object:', wallet ? { id: wallet.id, balance: wallet.balance, locked_balance: wallet.locked_balance, bonus_balance: wallet.bonus_balance } : null)
      console.log('Wallet balance:', wallet?.balance)
      console.log('Wallet locked_balance:', wallet?.locked_balance)
      console.log('Total gambling funds:', getTotalGamblingFunds())
      console.log('Formatted balance:', getTotalGamblingFunds()?.toFixed(2) || '0.00')
      console.log('=== END HEADER WALLET DEBUG ===')
    }
  }, [user?.id, wallet?.id, wallet?.balance, wallet?.locked_balance, wallet?.bonus_balance]);

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

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  // Render logged-out UI if user is null (regardless of loading state)
  // Use ClientOnly to prevent hydration issues with loading states
  return (
    <ClientOnly fallback={
      // Server-side fallback - render logged-out UI to match initial state
      <>
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
          <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6">
            <div className="h-full flex flex-col md:flex-row items-center justify-between py-2 md:py-0">
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
          </div>
        </header>
      </>
    }>
      {/* Client-side rendered content */}
      <>
        {isIpOrHttp && (
          <div className="w-full bg-yellow-600 text-white text-center py-2 text-xs z-[200]">
            Warning: You are running on an IP address or non-HTTPS. Login and wallet may not work properly on some devices/browsers. Use a real domain and HTTPS for production.
          </div>
        )}
        
        {user ? (
          // Logged in UI
          <>
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
                <Link 
                  href="/test-betting"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs"
                >
                  Test
                </Link>
                <button
                  onClick={handleCashierClick}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm min-w-[44px] min-h-[44px]"
                >
                  <span className="font-medium">${getTotalGamblingFunds()?.toFixed(2) || '0.00'}</span>
                </button>
                <UserMenu onCashierClick={handleCashierClick} />
              </div>
            </header>

            {/* Desktop Header */}
            <header className="fixed top-0 left-0 right-0 bg-black z-[150] h-28 md:h-40 hidden sm:flex">
              <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6">
                <div className="h-full flex flex-col md:flex-row items-center justify-between py-2 md:py-0">
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
                    <Link 
                      href="/test-betting"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs"
                    >
                      Test
                    </Link>
                    <button
                      onClick={handleCashierClick}
                      className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 md:px-4 py-2 rounded-lg transition-colors cursor-pointer text-sm md:text-base min-w-[44px] min-h-[44px]"
                    >
                      <span className="font-medium">${getTotalGamblingFunds()?.toFixed(2) || '0.00'}</span>
                    </button>
                    <UserMenu onCashierClick={handleCashierClick} />
                  </div>
                </div>
              </div>
            </header>
          </>
        ) : (
          // Logged out UI
          <>
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
              <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6">
                <div className="h-full flex flex-col md:flex-row items-center justify-between py-2 md:py-0">
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
              </div>
            </header>
          </>
        )}
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    </ClientOnly>
  )
} 