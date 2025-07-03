import { SupabaseClient } from '@supabase/supabase-js'

export interface FundBreakdown {
  totalLockedFunds: number
  genuineFunds: number           // Original balance + deposits (player keeps on cancellation)
  bonusFunds: number            // Bonus awarded (lost on cancellation)
  promotionWinnings: number     // Winnings during active promotion (lost on cancellation)
  totalWagered: number
  genuineFundsUsed: number      // How much genuine funds have been wagered
  bonusFundsUsed: number        // How much bonus funds have been wagered
  remainingGenuineFunds: number // Genuine funds left after wagering
  remainingBonusFunds: number   // Bonus funds left after wagering
  promotionTiedFunds: number    // Total funds tied to promotion (bonus + winnings)
}

/**
 * Calculate the breakdown of genuine vs bonus funds for a user with active promotion
 */
export async function calculateFundBreakdown(supabase: SupabaseClient, userId: string): Promise<FundBreakdown | null> {
  try {
    // Get user's wallet - be explicit about table reference due to RLS policies
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (walletError || !wallet) {
      console.error('Error fetching wallet:', walletError)
      return null
    }

    // Get active promotion - be explicit about table reference
    const { data: activePromotion, error: promoError } = await supabase
      .from('user_promotions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (promoError || !activePromotion) {
      console.error('No active promotion found:', promoError)
      return null
    }

    // Calculate fund breakdown
    const totalLockedFunds = wallet.locked_balance || 0
    const bonusFunds = activePromotion.bonus_amount || 0
    const originalGenuineBalance = activePromotion.original_genuine_balance || 0
    const totalWagered = activePromotion.wagering_progress || 0
    
    // Calculate how much of each fund type has been used
    const genuineFundsUsed = Math.min(totalWagered, originalGenuineBalance)
    const bonusFundsUsed = Math.max(0, totalWagered - originalGenuineBalance)
    
    // Calculate remaining funds
    const remainingGenuineFunds = Math.max(0, originalGenuineBalance - genuineFundsUsed)
    const remainingBonusFunds = Math.max(0, bonusFunds - bonusFundsUsed)
    
    // Calculate promotion winnings (any locked funds beyond genuine + bonus)
    const promotionWinnings = Math.max(0, totalLockedFunds - remainingGenuineFunds - remainingBonusFunds)
    const promotionTiedFunds = remainingBonusFunds + promotionWinnings

    return {
      totalLockedFunds,
      genuineFunds: originalGenuineBalance,
      bonusFunds,
      promotionWinnings,
      totalWagered,
      genuineFundsUsed,
      bonusFundsUsed,
      remainingGenuineFunds,
      remainingBonusFunds,
      promotionTiedFunds
    }
  } catch (error) {
    console.error('Error in calculateFundBreakdown:', error)
    return null
  }
}

/**
 * Cancel a promotion with proper fund segregation
 */
export async function cancelPromotionWithFundSegregation(supabase: SupabaseClient, userId: string): Promise<{
  success: boolean
  error?: string
  fundsKept?: number
  fundsLost?: number
  message?: string
}> {
  try {
    // Get fund breakdown before cancellation
    const breakdown = await calculateFundBreakdown(supabase, userId)
    if (!breakdown) {
      return { success: false, error: 'Unable to calculate fund breakdown' }
    }

    // Player keeps only their remaining genuine funds
    const fundsKept = breakdown.remainingGenuineFunds
    const fundsLost = breakdown.promotionTiedFunds

    console.log('Cancellation fund calculation:', {
      totalLockedFunds: breakdown.totalLockedFunds,
      remainingGenuineFunds: breakdown.remainingGenuineFunds,
      promotionTiedFunds: breakdown.promotionTiedFunds,
      fundsKept,
      fundsLost
    })

    // Start transaction to update wallet and promotion
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .update({
        balance: fundsKept,           // Player keeps genuine funds as available balance
        locked_balance: 0,           // No more locked funds
        bonus_balance: 0,            // Remove bonus balance
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (walletError) {
      console.error('Error updating wallet during cancellation:', walletError)
      return { success: false, error: 'Failed to update wallet' }
    }

    // Mark promotion as cancelled
    const { error: promoError } = await supabase
      .from('user_promotions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active')

    if (promoError) {
      console.error('Error updating promotion during cancellation:', promoError)
      return { success: false, error: 'Failed to update promotion status' }
    }

    return {
      success: true,
      fundsKept,
      fundsLost,
      message: `Promotion cancelled. You kept $${fundsKept.toFixed(2)} of genuine funds.`
    }
  } catch (error) {
    console.error('Error in cancelPromotionWithFundSegregation:', error)
    return { success: false, error: 'Unexpected error during cancellation' }
  }
}

/**
 * Complete a promotion and unlock all funds
 */
export async function completePromotionWithFundSegregation(supabase: SupabaseClient, userId: string): Promise<{
  success: boolean
  error?: string
  fundsUnlocked?: number
}> {
  try {
    // Get current wallet state
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('locked_balance')
      .eq('user_id', userId)
      .single()

    if (walletError || !wallet) {
      return { success: false, error: 'Failed to fetch wallet' }
    }

    const fundsUnlocked = wallet.locked_balance || 0

    // Update wallet - move all locked funds to available balance
    const { error: walletUpdateError } = await supabase
      .from('wallets')
      .update({
        balance: fundsUnlocked,
        locked_balance: 0,
        bonus_balance: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (walletUpdateError) {
      console.error('Error updating wallet during completion:', walletUpdateError)
      return { success: false, error: 'Failed to update wallet' }
    }

    // Mark promotion as completed
    const { error: promoError } = await supabase
      .from('user_promotions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active')

    if (promoError) {
      console.error('Error updating promotion during completion:', promoError)
      return { success: false, error: 'Failed to update promotion status' }
    }

    return {
      success: true,
      fundsUnlocked
    }
  } catch (error) {
    console.error('Error in completePromotionWithFundSegregation:', error)
    return { success: false, error: 'Unexpected error during completion' }
  }
}

/**
 * Set the original genuine balance when a promotion starts
 */
export async function setOriginalGenuineBalance(supabase: SupabaseClient, userId: string, userPromotionId: string, originalBalance: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_promotions')
      .update({ 
        original_genuine_balance: originalBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('id', userPromotionId)

    if (error) {
      console.error('Error setting original genuine balance:', error)
      throw new Error('Failed to set original genuine balance')
    }
  } catch (error) {
    console.error('Error in setOriginalGenuineBalance:', error)
    throw error
  }
}

/**
 * Get current fund status for a user
 */
export async function getFundStatus(supabase: SupabaseClient, userId: string): Promise<{
  hasActivePromotion: boolean
  availableBalance: number
  lockedBalance: number
  bonusBalance: number
  fundBreakdown?: FundBreakdown
}> {
  try {
    // Get wallet info
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance, locked_balance, bonus_balance')
      .eq('user_id', userId)
      .single()

    if (walletError || !wallet) {
      throw new Error('Failed to fetch wallet')
    }

    // Check for active promotion
    const { data: activePromotion, error: promoError } = await supabase
      .from('user_promotions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    const hasActivePromotion = !promoError && !!activePromotion

    let fundBreakdown: FundBreakdown | undefined
    if (hasActivePromotion) {
      fundBreakdown = await calculateFundBreakdown(supabase, userId) || undefined
    }

    return {
      hasActivePromotion,
      availableBalance: wallet.balance || 0,
      lockedBalance: wallet.locked_balance || 0,
      bonusBalance: wallet.bonus_balance || 0,
      fundBreakdown
    }
  } catch (error) {
    console.error('Error in getFundStatus:', error)
    throw error
  }
} 