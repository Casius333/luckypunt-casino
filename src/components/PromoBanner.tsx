'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { useBanners, Banner } from '@/hooks/useBanners'

interface PromoBannerProps {
  bannerType?: string
  height?: string
  autoRotate?: boolean
  rotationInterval?: number
  className?: string
  showButton?: boolean
  buttonText?: string
  buttonLink?: string
}

export default function PromoBanner({
  bannerType = 'promotion-web',
  height = 'h-[100px]',
  autoRotate = true,
  rotationInterval = 5000,
  className = '',
  showButton = true,
  buttonText = 'View Promotions',
  buttonLink = '/promotions'
}: PromoBannerProps) {
  const { banners, loading, error } = useBanners(bannerType, true)
  const [currentSlide, setCurrentSlide] = useState(0)
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
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, rotationInterval)

    return () => clearInterval(timer)
  }, [autoRotate, banners.length, rotationInterval])

  // Reset current slide when banners change
  useEffect(() => {
    setCurrentSlide(0)
  }, [banners])

  // Get appropriate image URL based on screen size
  const getImageUrl = (banner: Banner): string => {
    if (isMobile && banner.mobile_image_url) {
      return banner.mobile_image_url
    }
    return banner.image_url || '/placeholder-promotion.svg'
  }

  // Loading state
  if (loading) {
    return (
      <section className={`bg-gray-600 ${height} flex items-center justify-between px-4 sm:px-8 mt-5 w-full animate-pulse ${className}`}>
        <div className="bg-gray-500 h-6 w-32 rounded"></div>
        <div className="bg-gray-500 h-8 w-20 rounded-lg"></div>
      </section>
    )
  }

  // Error state or no banners - show fallback
  if (error || !banners || banners.length === 0) {
    return (
      <section className={`bg-red-400 ${height} flex items-center justify-between px-4 sm:px-8 mt-5 w-full ${className}`}>
        <h2 className="text-xl sm:text-3xl font-bold text-white">Special Promotions</h2>
        {showButton && (
          <Link 
            href={buttonLink}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 sm:px-5 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        )}
      </section>
    )
  }

  return (
        <section className={`relative ${height} mt-5 w-full overflow-hidden ${className}`}>
       {/* Background to prevent black flashes */}
       <div className="absolute inset-0 bg-red-400 z-0"></div>
       
       {/* Banner slides */}
       {banners.map((banner, index) => (
         <div
           key={banner.id}
           className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
             index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-5'
           }`}
         >
          <div className="relative h-full w-full">
            <Image
              src={getImageUrl(banner)}
              alt={`Promotion ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 1200px"
                             onError={(e) => {
                 const target = e.target as HTMLImageElement
                 target.src = '/placeholder-promotion.svg'
               }}
            />
            
                         {/* Content overlay */}
             <div className="absolute inset-0 flex items-center justify-end px-4 sm:px-8">
               {showButton && (
                 <Link 
                   href={buttonLink}
                   className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 sm:px-5 py-2 rounded-lg transition-colors backdrop-blur-sm text-sm sm:text-base"
                 >
                   <span>{buttonText}</span>
                   <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                 </Link>
               )}
             </div>
          </div>
        </div>
      ))}

      {/* Dots indicator (only if multiple banners) */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/40'
              }`}
              aria-label={`Go to promotion ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
} 