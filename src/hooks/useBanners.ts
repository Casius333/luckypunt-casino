'use client'

import { useState, useEffect } from 'react'

export interface Banner {
  id: string
  banner_id: string
  image_url: string | null
  mobile_image_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export function useBanners(bannerType?: string, activeOnly: boolean = true) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBanners = async () => {
    try {
      setLoading(true)
      setError(null)

      // Note: Banners are public content, no authentication required

      // Build query parameters
      const params = new URLSearchParams()
      if (bannerType) {
        params.append('type', bannerType)
      }
      if (activeOnly) {
        params.append('active', 'true')
      }

      // Fetch banners from API
      const response = await fetch(`/api/banners?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch banners')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch banners')
      }

      setBanners(result.banners || [])
    } catch (err) {
      console.error('Error fetching banners:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch banners'
      setError(errorMessage)
      setBanners([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [bannerType, activeOnly])

  return {
    banners,
    loading,
    error,
    refetch: fetchBanners,
  }
} 