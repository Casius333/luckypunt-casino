'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Home, Gift, Wallet, Crown, Settings, LogOut } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { showModal } from './ModalContainer'
import { toast } from 'sonner'

interface UserMenuProps {
  onCashierClick: () => void
}

const menuItems = [
  { href: '/', label: 'Home', icon: Home },
  { label: 'Cashier', icon: Wallet },
  { href: '/promotions', label: 'Promotions', icon: Gift },
  { href: '/vip', label: 'VIP', icon: Crown },
  { label: 'Settings', icon: Settings },
]

export default function UserMenu({ onCashierClick }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsOpen(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-white hover:text-purple-400 transition-colors min-w-[44px] min-h-[44px]"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-white/10 z-50 hidden sm:block">
            <div className="py-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                if (item.label === 'Cashier') {
                  return (
                    <button
                      key="cashier"
                      onClick={() => {
                        setIsOpen(false)
                        onCashierClick()
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-base min-h-[44px]"
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  )
                }
                if (item.label === 'Settings') {
                  return (
                    <button
                      key="settings"
                      onClick={() => {
                        setIsOpen(false)
                        showModal('settings')
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-base min-h-[44px]"
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-base min-h-[44px]"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
            <div className="border-t border-white/10">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-4 py-2 text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors text-base min-h-[44px]"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
          {/* Mobile dropdown */}
          <div className="fixed bottom-0 left-0 right-0 w-full bg-gray-900 rounded-t-lg shadow-2xl border-t border-white/10 z-50 flex flex-col sm:hidden">
            <div className="py-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                if (item.label === 'Cashier') {
                  return (
                    <button
                      key="cashier"
                      onClick={() => {
                        setIsOpen(false)
                        onCashierClick()
                      }}
                      className="flex w-full items-center gap-3 px-6 py-4 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-lg min-h-[48px]"
                    >
                      <Icon size={22} />
                      <span>{item.label}</span>
                    </button>
                  )
                }
                if (item.label === 'Settings') {
                  return (
                    <button
                      key="settings"
                      onClick={() => {
                        setIsOpen(false)
                        showModal('settings')
                      }}
                      className="flex w-full items-center gap-3 px-6 py-4 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-lg min-h-[48px]"
                    >
                      <Icon size={22} />
                      <span>{item.label}</span>
                    </button>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className="flex items-center gap-3 px-6 py-4 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-lg min-h-[48px]"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={22} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
            <div className="border-t border-white/10">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-6 py-4 text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors text-lg min-h-[48px]"
              >
                <LogOut size={22} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 