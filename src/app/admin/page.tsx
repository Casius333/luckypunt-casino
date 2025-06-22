'use client'

import { useEffect, useState } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import {
  Users,
  Wallet,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalDeposits: number
  activeGames: number
  pendingWithdrawals: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDeposits: 0,
    activeGames: 0,
    pendingWithdrawals: 0
  })
  const supabase = createPagesBrowserClient()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  async function fetchDashboardStats() {
    // Get total users
    const { count: userCount } = await supabase
      .from('players')
      .select('id', { count: 'exact' })

    // Get total deposits for today
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const { data: deposits } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'deposit')
      .eq('status', 'completed')
      .gte('created_at', startOfDay.toISOString())

    // Get active game sessions
    const { count: activeGames } = await supabase
      .from('game_sessions')
      .select('id', { count: 'exact' })
      .eq('status', 'active')

    // Get pending withdrawals
    const { count: pendingWithdrawals } = await supabase
      .from('transactions')
      .select('id', { count: 'exact' })
      .eq('type', 'withdraw')
      .eq('status', 'pending')

    setStats({
      totalUsers: userCount || 0,
      totalDeposits: deposits?.reduce((sum, tx) => sum + tx.amount, 0) || 0,
      activeGames: activeGames || 0,
      pendingWithdrawals: pendingWithdrawals || 0
    })
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-600'
    },
    {
      title: "Today's Deposits",
      value: `$${stats.totalDeposits.toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-green-600'
    },
    {
      title: 'Active Games',
      value: stats.activeGames,
      icon: Wallet,
      color: 'bg-purple-600'
    },
    {
      title: 'Pending Withdrawals',
      value: stats.pendingWithdrawals,
      icon: AlertTriangle,
      color: 'bg-yellow-600'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white/5 rounded-lg p-6 border border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm">{stat.title}</h3>
                  <p className="text-2xl font-semibold text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add more dashboard sections here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">
            Recent Transactions
          </h3>
          {/* Add transaction list component */}
        </div>

        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">
            Active Users
          </h3>
          {/* Add active users component */}
        </div>
      </div>
    </div>
  )
} 