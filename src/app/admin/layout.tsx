'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  Users,
  Wallet,
  BarChart3,
  Settings,
  GamepadIcon,
  Gift,
  Bell
} from 'lucide-react'

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Transactions', href: '/admin/transactions', icon: Wallet },
  { label: 'Games', href: '/admin/games', icon: GamepadIcon },
  { label: 'Promotions', href: '/admin/promotions', icon: Gift },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAdminStatus()
  }, [])

  async function checkAdminStatus() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!adminUser) {
      router.push('/')
      return
    }

    setIsAdmin(true)
  }

  if (isAdmin === null) {
    return <div>Loading...</div>
  }

  if (isAdmin === false) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-black">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white/5 border-r border-white/10">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white">Admin Portal</h1>
        </div>
        <nav className="mt-6">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-6 py-3 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <header className="h-16 border-b border-white/10 bg-white/5 flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold text-white">Admin Dashboard</h2>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Bell size={20} />
            </button>
            <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
              A
            </div>
          </div>
        </header>
        
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
} 