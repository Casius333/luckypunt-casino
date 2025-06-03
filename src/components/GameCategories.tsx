'use client'

import { Gamepad2, Star, TableProperties, Video, Sparkles, Trophy, Heart, Search } from 'lucide-react'

interface Category {
  id: string
  label: string
  icon: any
}

const categories: Category[] = [
  { id: 'slots', label: 'Slots', icon: Gamepad2 },
  { id: 'popular', label: 'Popular', icon: Star },
  { id: 'table-games', label: 'Table Games', icon: TableProperties },
  { id: 'live-casino', label: 'Live Casino', icon: Video },
  { id: 'new-games', label: 'New Games', icon: Sparkles },
  { id: 'jackpots', label: 'Jackpots', icon: Trophy },
  { id: 'favorites', label: 'Favorites', icon: Heart }
]

export default function GameCategories() {
  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
      {categories.map((category) => {
        const Icon = category.icon
        return (
          <button
            key={category.id}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-gray-300 hover:bg-purple-600 hover:text-white transition-colors whitespace-nowrap"
          >
            <Icon size={18} />
            <span>{category.label}</span>
          </button>
        )
      })}
      
      <div className="flex-1" />
      
      <div className="relative">
        <input
          type="text"
          placeholder="Search games..."
          className="pl-10 pr-4 py-2 bg-white/5 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      </div>
    </div>
  )
} 