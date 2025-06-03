'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wallet, Gift, User, LogOut } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Cashier', href: '/cashier', icon: Wallet },
    { label: 'Promotions', href: '/promotions', icon: Gift },
    { label: 'Profile', href: '/profile', icon: User },
  ]

  return (
    <nav className="w-[240px] bg-black/90 h-screen fixed left-0 top-0 p-4">
      <div className="flex flex-col h-full">
        <div className="flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
        
        <button 
          onClick={() => {/* Add logout handler */}}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
} 