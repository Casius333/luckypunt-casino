'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Home, Gift, Wallet, Crown, Settings, LogOut } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface UserMenuProps {
  onCashierClick: () => void
}

const menuItems = [
  { href: '/', label: 'Home', icon: Home },
  { label: 'Cashier', icon: Wallet },
  { href: '/promotions', label: 'Promotions', icon: Gift },
  { href: '/vip', label: 'VIP', icon: Crown },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function UserMenu({ onCashierClick }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClientComponentClient()
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
        className="p-2 text-white hover:text-purple-400 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-white/10">
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
                      className="flex w-full items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
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
                    className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
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
                className="flex w-full items-center gap-3 px-4 py-2 text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 