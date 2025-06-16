'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Promotion {
  id: number
  title: string
  description: string
  bgColor: string
  buttonText: string
  buttonLink: string
}

const promotions: Promotion[] = [
  {
    id: 1,
    title: 'Daily Deposit Bonus',
    description: 'Get 100% bonus on your next deposit!',
    bgColor: 'bg-purple-600',
    buttonText: 'View Promotions',
    buttonLink: '/promotions'
  },
  {
    id: 2,
    title: 'Weekly Cashback',
    description: 'Earn up to 10% cashback on your weekly losses',
    bgColor: 'bg-blue-600',
    buttonText: 'Learn More',
    buttonLink: '/promotions/cashback'
  },
  // Add more promotions as needed
]

export default function PromoBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promotions.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % promotions.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + promotions.length) % promotions.length)
  }

  return (
    <div className="relative w-full h-[140px] sm:h-[200px] overflow-hidden rounded-lg">
      {promotions.map((promo, index) => (
        <div
          key={promo.id}
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            index === currentSlide ? 'translate-x-0' : 'translate-x-full'
          } ${promo.bgColor}`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-full px-4 sm:px-8 py-4 sm:py-0 w-full">
            <div className="space-y-1 sm:space-y-2">
              <h2 className="text-lg sm:text-2xl font-bold text-white">{promo.title}</h2>
              <p className="text-xs sm:text-base text-white/80 max-w-xs sm:max-w-none">{promo.description}</p>
              <button className="mt-2 sm:mt-4 px-4 sm:px-6 py-2 bg-white text-purple-600 rounded-lg hover:bg-white/90 transition-colors text-xs sm:text-base min-w-[44px] min-h-[44px]">
                {promo.buttonText}
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors min-w-[44px] min-h-[44px]"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors min-w-[44px] min-h-[44px]"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {promotions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
} 