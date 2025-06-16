'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Gamepad2, Dice1, PlaySquare, Trophy, ArrowRight } from 'lucide-react'
import GameGrid from '@/components/GameGrid'
import Image from 'next/image'

interface Promotion {
  id: number
  title: string
  bgColor: string
}

interface Banner {
  id: number
  title: string
  bgColor: string
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
    bgColor: "bg-emerald-500"
  },
  {
    id: 2,
    title: "Banner 1",
    bgColor: "bg-blue-500"
  },
  {
    id: 3,
    title: "Banner 1",
    bgColor: "bg-purple-500"
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
  { id: 'all', label: 'All Games', icon: <Gamepad2 className="w-5 h-5" /> },
  { id: 'slots', label: 'Slots', icon: <PlaySquare className="w-5 h-5" /> },
  { id: 'table', label: 'Table Games', icon: <Dice1 className="w-5 h-5" /> },
  { id: 'jackpot', label: 'Jackpots', icon: <Trophy className="w-5 h-5" /> },
]

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [activeCategory, setActiveCategory] = useState('all')
  const [currentBanner, setCurrentBanner] = useState(0)
  const [currentPromotion, setCurrentPromotion] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 4000) // Rotate every 4 seconds

    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % promotions.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + promotions.length) % promotions.length)
  }

  const filteredGames = activeCategory === 'all' 
    ? games 
    : games.filter(game => game.category === activeCategory)

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length)
  }

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)
  }

  return (
    <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-6">
      {/* Banner section */}
      <section className="relative h-[225px] w-full">
        {/* Banner slides */}
        <div className="relative h-full w-full">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-500 flex items-center px-4 sm:px-8 ${banner.bgColor} ${
                index === currentBanner ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <h2 className="text-4xl sm:text-6xl font-bold text-white">{banner.title}</h2>
            </div>
          ))}
        </div>

        {/* Dots indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentBanner ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Promotions section */}
      <section className="bg-red-400 h-[119px] flex items-center justify-between px-4 sm:px-8 mt-5 w-full">
        <h2 className="text-2xl sm:text-4xl font-bold text-white">Promotion 1</h2>
        <Link 
          href="/promotions" 
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-3 rounded-lg transition-colors"
        >
          <span>View Promotions</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

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
