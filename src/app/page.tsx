'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Gamepad2, Dice1, PlaySquare, Trophy, ArrowRight } from 'lucide-react'
import GameGrid from '@/components/GameGrid'
import BannerCarousel from '@/components/BannerCarousel'
import PromoBanner from '@/components/PromoBanner'
import Image from 'next/image'

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
  { id: 'all', label: 'All Games', icon: <Gamepad2 className="w-5 h-5" /> },
  { id: 'slots', label: 'Slots', icon: <PlaySquare className="w-5 h-5" /> },
  { id: 'table', label: 'Table Games', icon: <Dice1 className="w-5 h-5" /> },
  { id: 'jackpot', label: 'Jackpots', icon: <Trophy className="w-5 h-5" /> },
]

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const filteredGames = activeCategory === 'all' 
    ? games 
    : games.filter(game => game.category === activeCategory)

  // Determine banner types based on screen size
  const mainBannerType = isMobile ? 'main-mobile' : 'main-web'
  const promoBannerType = isMobile ? 'promotion-mobile' : 'promotion-web'

  return (
    <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-6">
      {/* Main Banner section */}
      <BannerCarousel 
        bannerType={mainBannerType}
        height="h-[225px]"
        autoRotate={true}
        rotationInterval={4000}
        showDots={true}
        fallbackContent={
          <div className="relative h-full w-full bg-emerald-500 flex items-center px-4 sm:px-8">
            <h2 className="text-4xl sm:text-6xl font-bold text-white">Banner 1</h2>
          </div>
        }
      />

      {/* Promotions Banner section */}
      <PromoBanner 
        bannerType={promoBannerType}
        height="h-[119px]"
        autoRotate={true}
        rotationInterval={5000}
        showButton={true}
        buttonText="View Promotions"
        buttonLink="/promotions"
      />

      {/* Games section */}
      <section className="mt-8 w-full">
        {/* Game Categories */}
        <div className="flex items-center space-x-2 sm:space-x-4 mb-8 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category.id ? 'bg-purple-600' : 'bg-gray-800'
              }`}
            >
              {category.icon}
              <span className="text-white text-sm sm:text-base">{category.label}</span>
            </button>
          ))}
        </div>

        <GameGrid category={selectedCategory} />
      </section>
    </main>
  )
}
