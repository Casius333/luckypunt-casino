'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useBanners, Banner } from '@/hooks/useBanners'

interface BannerCarouselProps {
  bannerType: string
  height?: string
  autoRotate?: boolean
  rotationInterval?: number
  className?: string
  showDots?: boolean
  fallbackContent?: React.ReactNode
}

export default function BannerCarousel({
  bannerType,
  height = 'h-[225px]',
  autoRotate = true,
  rotationInterval = 4000,
  className = '',
  showDots = true,
  fallbackContent
}: BannerCarouselProps) {
  const { banners, loading, error } = useBanners(bannerType, true)
  const [currentBanner, setCurrentBanner] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotate || banners.length <= 1) return

    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, rotationInterval)

    return () => clearInterval(timer)
  }, [autoRotate, banners.length, rotationInterval])

  // Reset current banner when banners change
  useEffect(() => {
    setCurrentBanner(0)
  }, [banners])

  // Get appropriate image URL based on screen size
  const getImageUrl = (banner: Banner): string => {
    if (isMobile && banner.mobile_image_url) {
      return banner.mobile_image_url
    }
    return banner.image_url || '/placeholder-banner.svg'
  }

  // Loading state
  if (loading) {
    return (
      <section className={`relative ${height} w-full ${className}`}>
        <div className="relative h-full w-full bg-gray-800 animate-pulse flex items-center justify-center">
          <div className="text-white/60">Loading banners...</div>
        </div>
      </section>
    )
  }

  // Error state or no banners - show fallback
  if (error || !banners || banners.length === 0) {
    if (fallbackContent) {
      return (
        <section className={`relative ${height} w-full ${className}`}>
          {fallbackContent}
        </section>
      )
    }
    
    // Default fallback
    return (
      <section className={`relative ${height} w-full ${className}`}>
        <div className="relative h-full w-full bg-gradient-to-r from-purple-600 to-purple-400 flex items-center px-4 sm:px-8">
          <h2 className="text-4xl sm:text-6xl font-bold text-white">Welcome to LuckyPunt</h2>
        </div>
      </section>
    )
  }

  return (
    <section className={`relative ${height} w-full ${className}`}>
      {/* Banner slides */}
      <div className="relative h-full w-full bg-gray-900">
        {/* Background slide - always visible */}
        {banners.length > 0 && (
          <div className="absolute inset-0 z-0">
            <Image
              src={getImageUrl(banners[currentBanner])}
              alt="Background"
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-banner.svg'
              }}
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}
        
        {/* Foreground slides with crossfade */}
        {banners.map((banner, index) => (
          <div
            key={`${banner.id}-${index}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-5'
            }`}
          >
            <Image
              src={getImageUrl(banner)}
              alt={`Banner ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 1200px"
              onError={(e) => {
                // Fallback to placeholder on error
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-banner.svg'
              }}
            />
            {/* Overlay for better text readability if needed */}
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ))}
      </div>

      {/* Dots indicator */}
      {showDots && banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentBanner ? 'bg-white' : 'bg-white/40'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
} 