'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'

interface Promotion {
  id: string
  name: string
  description: string
  bonus_percent: number
  min_deposit_amount: number
}

interface UserPromotion {
  id: string
  status: string
  bonus_amount: number
  wagering_progress: number
  wagering_requirement: number
  promotion?: Promotion
}

export default function PromotionsDebugPage() {
  const { user, loading: authLoading } = useUser()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [userPromotions, setUserPromotions] = useState<UserPromotion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const supabase = createClient()

        console.log('Fetching promotions...')
        const { data: promoData, error: promoError } = await supabase
          .from('promotions')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (promoError) {
          console.error('Promotions error:', promoError)
          setError(promoError.message)
        } else {
          console.log('Promotions data:', promoData)
          setPromotions(promoData || [])
        }

        if (user?.id) {
          console.log('Fetching user promotions for user:', user.id)
          const { data: userPromoData, error: userPromoError } = await supabase
            .from('user_promotions')
            .select(`
              *,
              promotion:promotions(*)
            `)
            .eq('user_id', user.id)
            .order('activated_at', { ascending: false })

          if (userPromoError) {
            console.error('User promotions error:', userPromoError)
          } else {
            console.log('User promotions data:', userPromoData)
            setUserPromotions(userPromoData || [])
          }
        }

      } catch (err) {
        console.error('Unexpected error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  if (authLoading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading auth...</div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Promotions Debug</h1>
        
        <div className="space-y-6">
          {/* Auth Status */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-2">Auth Status</h2>
            <p className="text-gray-300">User: {user ? user.email : 'Not logged in'}</p>
            <p className="text-gray-300">User ID: {user?.id || 'N/A'}</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-white">Loading data...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-900 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Promotions Data */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-2">
              Available Promotions ({promotions.length})
            </h2>
            {promotions.length > 0 ? (
              <div className="space-y-2">
                {promotions.map((promo) => (
                  <div key={promo.id} className="bg-gray-700 p-3 rounded">
                    <p className="text-white font-medium">{promo.name}</p>
                    <p className="text-gray-300 text-sm">{promo.description}</p>
                    <p className="text-gray-400 text-xs">
                      {promo.bonus_percent}% bonus, min deposit: ${promo.min_deposit_amount}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-300">No promotions found</p>
            )}
          </div>

          {/* User Promotions Data */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-2">
              User Promotions ({userPromotions.length})
            </h2>
            {userPromotions.length > 0 ? (
              <div className="space-y-2">
                {userPromotions.map((userPromo) => (
                  <div key={userPromo.id} className="bg-gray-700 p-3 rounded">
                    <p className="text-white font-medium">
                      {userPromo.promotion?.name || 'Unknown Promotion'}
                    </p>
                    <p className="text-gray-300 text-sm">Status: {userPromo.status}</p>
                    <p className="text-gray-400 text-xs">
                      Bonus: ${userPromo.bonus_amount}, 
                      Wagered: ${userPromo.wagering_progress} / ${userPromo.wagering_requirement}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-300">No user promotions found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 