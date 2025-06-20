'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

export interface Promotion {
  id: string
  name: string
  description: string
  type: string
  bonus_percent: number
  min_deposit_amount: number
  max_bonus_amount: number
  wagering_multiplier: number
  is_active: boolean
  created_at: string
  end_at: string | null
  max_withdrawal_amount: number | null
}

export interface UserPromotion {
  id: string
  user_id: string
  promotion_id: string
  status: 'active' | 'completed' | 'cancelled' | 'forfeited'
  activated_at: string
  completed_at: string | null
  forfeited_at: string | null
  bonus_amount: number
  bonus_balance: number
  wagering_requirement: number
  wagering_progress: number
  promotion: Promotion
}

export function usePromotions(userId?: string) {
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([])
  const [userPromotions, setUserPromotions] = useState<UserPromotion[]>([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPromotions = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setAvailablePromotions([])
        setUserPromotions([])
        setLoading(false)
        return
      }

      // Fetch available promotions
      const { data: availablePromotions, error: promoError } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gt('end_at', new Date().toISOString())

      if (promoError) {
        console.error('Error fetching promotions:', promoError)
        setError('Failed to fetch promotions')
      } else {
        setAvailablePromotions(availablePromotions || [])
      }

      // Fetch all user promotions
      const { data: allUserPromotions, error: userPromoError } = await supabase
        .from('user_promotions')
        .select(
          `
          *,
          promotion:promotions (*)
        `
        )
        .eq('user_id', user.id)

      if (userPromoError) {
        console.error('Error fetching user promotions:', userPromoError)
        setError('Failed to fetch user promotions')
      } else {
        setUserPromotions(allUserPromotions || [])
      }
    } catch (err) {
      console.error('Unexpected error in fetchPromotions:', err)
      setError('Unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const activatePromotion = async (promotionId: string) => {
    setActivating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('user_promotions')
        .insert({
          user_id: user.id,
          promotion_id: promotionId,
          status: 'active',
          activated_at: new Date().toISOString(),
          bonus_amount: 0,
          bonus_balance: 0,
          wagering_requirement: 0,
          wagering_progress: 0,
        })

      if (error) {
        throw error
      }

      // Refresh promotions
      await fetchPromotions()
    } catch (err) {
      console.error('Error activating promotion:', err)
      throw err
    } finally {
      setActivating(false)
    }
  }

  const cancelPromotion = async (userPromotionId: string) => {
    setCancelling(userPromotionId)
    try {
      const { error } = await supabase
        .from('user_promotions')
        .update({ status: 'cancelled', forfeited_at: new Date().toISOString() })
        .eq('id', userPromotionId)

      if (error) {
        throw error
      }

      // Refresh promotions
      await fetchPromotions()
    } catch (err) {
      console.error('Error cancelling promotion:', err)
      throw err
    } finally {
      setCancelling(null)
    }
  }

  useEffect(() => {
    fetchPromotions()
  }, [userId])

  const activePromotion = userPromotions.find(p => p.status === 'active')
  const completedPromotions = userPromotions.filter(p => p.status === 'completed')
  const cancelledPromotions = userPromotions.filter(p => ['cancelled', 'forfeited'].includes(p.status))

  return {
    availablePromotions,
    userPromotions,
    activePromotion,
    completedPromotions,
    cancelledPromotions,
    loading,
    activating,
    cancelling,
    error,
    activatePromotion,
    cancelPromotion,
    refetch: fetchPromotions,
  }
} 