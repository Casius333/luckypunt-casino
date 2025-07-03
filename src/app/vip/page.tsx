'use client'

import { Crown } from 'lucide-react'

export default function VIPPage() {
  return (
    <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Crown className="w-24 h-24 text-yellow-400" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white">VIP Program</h1>
        <p className="text-xl md:text-2xl text-gray-400">Coming Soon</p>
        <p className="text-gray-500 max-w-md mx-auto">
          Our exclusive VIP program is currently under development. Stay tuned for premium rewards and benefits!
        </p>
      </div>
    </div>
  )
} 