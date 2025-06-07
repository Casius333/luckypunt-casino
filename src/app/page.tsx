'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import GameGrid from '@/components/GameGrid'

interface Promotion {
  id: number
  title: string
  bgColor: string
}

interface Banner {
  id: number
  title: string
  description?: string
  bgColor: string
  height: string
  showButton?: boolean
}

const promotions: Promotion[] = [
  {
    id: 1,
    title: "Promotion 1",
    bgColor: "from-red-400 to-red-300"
  },
  {
    id: 2,
    title: "Promotion 2",
    bgColor: "from-red-400 to-red-300"
  }
]

const banners: Banner[] = [
  {
    id: 1,
    title: "Banner 1",
    bgColor: "from-emerald-500 to-green-400",
    height: "h-72",
    showButton: false
  },
  {
    id: 2,
    title: "Banner 2",
    bgColor: "from-emerald-500 to-green-400",
    height: "h-72",
    showButton: false
  }
]

const games = [
  { id: 1, title: 'ROULETTE', category: 'table' },
  { id: 2, title: 'BACCARAT', category: 'table' },
  { id: 3, title: 'BACCARAT', category: 'table' },
  { id: 4, title: 'LUCKY SLOTS', category: 'slots' },
  { id: 5, title: 'POKER', category: 'table' },
  { id: 6, title: 'POKER', category: 'table' },
  { id: 7, title: 'ROULETTE', category: 'table' },
  { id: 8, title: 'BACCARAT', category: 'table' },
  { id: 9, title: 'BACCARAT', category: 'table' },
  { id: 10, title: 'ROULETTE', category: 'table' },
  { id: 11, title: 'BACCARAT', category: 'table' },
  { id: 12, title: 'POKER', category: 'table' },
  { id: 13, title: 'LUCKY SLOTS', category: 'slots' },
  { id: 14, title: 'ROULETTE', category: 'table' },
  { id: 15, title: 'BACCARAT', category: 'table' },
  { id: 16, title: 'POKER', category: 'table' }
]

const categories = [
  { id: 'slots', label: 'Slots', icon: '⚪' },
  { id: 'popular', label: 'Popular', icon: '⭐' },
  { id: 'table', label: 'Table Games', icon: '🎲' },
  { id: 'live', label: 'Live Casino', icon: '🎰' },
  { id: 'jackpot', label: 'Jackpots', icon: '💰' },
  { id: 'search', label: 'Search', icon: '🔍' }
]

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [activeCategory, setActiveCategory] = useState('all')
  const [currentBanner, setCurrentBanner] = useState(0)
  const [currentPromotion, setCurrentPromotion] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('slots')
  const router = useRouter()

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % promotions.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + promotions.length) % promotions.length)
  }

  const filteredGames = activeCategory === 'all' 
    ? games 
    : games.filter(game => game.category === activeCategory)

  return (
    <div className="min-h-screen">
      {/* Banner 1 Section */}
      <div className="relative w-full mb-8 z-0">
        <div className="relative h-72">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 w-full bg-gradient-to-r ${banner.bgColor} rounded-lg flex items-center justify-between px-8 transition-opacity duration-300 ${
                index === currentBanner ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <h2 className="text-6xl font-bold text-white">{banner.title}</h2>
              {banner.showButton && (
                <button className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors">
                  View Promotions
                </button>
              )}
            </div>
          ))}
        </div>
        
        {/* Carousel Navigation */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentBanner ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={() => setCurrentBanner(index)}
            />
          ))}
        </div>
      </div>

      {/* Banner 2 (Promotions) Section */}
      <div className="relative w-full mb-8 z-0">
        <div className="relative h-24">
          {promotions.map((promo, index) => (
            <div
              key={promo.id}
              className={`w-full h-24 bg-gradient-to-r ${promo.bgColor} rounded-lg flex items-center justify-between px-8 absolute inset-0 transition-opacity duration-300 ${
                index === currentPromotion ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <h2 className="text-2xl font-bold text-white">{promo.title}</h2>
              <button className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors">
                View Promotions
              </button>
            </div>
          ))}
        </div>
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {promotions.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentPromotion ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={() => setCurrentPromotion(index)}
            />
          ))}
        </div>
      </div>

      {/* Game Categories */}
      <div className="flex items-center space-x-4 mb-8 px-4">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              selectedCategory === category.id ? 'bg-purple-600' : 'bg-gray-800'
            }`}
          >
            <span>{category.icon}</span>
            <span className="text-lg">{category.label}</span>
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="px-4">
        <GameGrid />
      </div>
    </div>
  )
}
