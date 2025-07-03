import { createClient } from './supabase/client'

/**
 * Apply deposit bonus when user makes a deposit
 * This function should be called from the deposit handler after a successful deposit
 */
export async function applyDepositBonus(userId: string, depositAmount: number) {
  const supabase = createClient()

  try {
    // Find active deposit-type promotion for this user
    const { data: activePromotion, error: fetchError } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotion:promotions(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('bonus_amount', 0) // Only promotions that haven't been awarded yet
      .single()

    if (fetchError || !activePromotion) {
      // No active deposit promotion found
      console.log('No active deposit promotion found for user:', userId)
      return { success: false, message: 'No active deposit promotion found' }
    }

    const promotion = activePromotion.promotion
    if (!promotion || promotion.type !== 'deposit') {
      // Not a deposit-type promotion
      console.log('Not a deposit-type promotion:', promotion?.id)
      return { success: false, message: 'Not a deposit-type promotion' }
    }

    // Check if deposit meets minimum requirement
    if (depositAmount < promotion.min_deposit_amount) {
      console.log(`Deposit amount ${depositAmount} is less than minimum ${promotion.min_deposit_amount}`)
      return { 
        success: false, 
        message: `Deposit amount must be at least $${promotion.min_deposit_amount}` 
      }
    }

    // Calculate bonus amount
    const bonusAmount = Math.min(
      (depositAmount * promotion.bonus_percent) / 100,
      promotion.max_bonus_amount
    )

    if (bonusAmount <= 0) {
      console.log('Calculated bonus amount is 0 or negative')
      return { success: false, message: 'No bonus to award' }
    }

    // Calculate wagering requirement
    const wageringRequirement = bonusAmount * promotion.wagering_multiplier

    // Update user promotion with bonus details
    const { error: updateError } = await supabase
      .from('user_promotions')
      .update({
        deposit_amount: depositAmount,
        bonus_amount: bonusAmount,
        bonus_balance: bonusAmount,
        wagering_required: wageringRequirement,
        wagering_progress: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', activePromotion.id)

    if (updateError) {
      console.error('Error updating user promotion:', updateError)
      throw updateError
    }

    // Add bonus to user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (walletError || !wallet) {
      console.error('Error fetching wallet:', walletError)
      throw new Error('Wallet not found')
    }

    // Update wallet balance
    const { error: balanceError } = await supabase
      .from('wallets')
      .update({
        balance: wallet.balance + bonusAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)

    if (balanceError) {
      console.error('Error updating wallet balance:', balanceError)
      throw balanceError
    }

    // Record bonus transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        type: 'deposit_bonus',
        amount: bonusAmount,
        currency: 'AUD',
        status: 'completed',
        reference_id: `bonus_${activePromotion.id}`,
        metadata: { 
          description: `Deposit bonus from ${promotion.name}`,
          deposit_amount: depositAmount,
          promotion_id: promotion.id,
          user_promotion_id: activePromotion.id
        }
      })

    if (transactionError) {
      console.error('Error recording bonus transaction:', transactionError)
      throw transactionError
    }

    console.log(`Successfully applied deposit bonus: $${bonusAmount} for user ${userId}`)

    return {
      success: true,
      bonusAmount,
      wageringRequirement,
      message: `Deposit bonus applied! You received $${bonusAmount.toFixed(2)} bonus`
    }

  } catch (error) {
    console.error('Error applying deposit bonus:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to apply deposit bonus'
    }
  }
}

/**
 * Check if user has an active deposit promotion waiting for deposit
 */
export async function hasActiveDepositPromotion(userId: string) {
  const supabase = createClient()

  try {
    const { data: activePromotion, error } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotion:promotions(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('bonus_amount', 0) // Only promotions that haven't been awarded yet
      .single()

    if (error || !activePromotion) {
      return false
    }

    const promotion = activePromotion.promotion
    return promotion && promotion.type === 'deposit'

  } catch (error) {
    console.error('Error checking active deposit promotion:', error)
    return false
  }
}

/**
 * Get active deposit promotion details
 */
export async function getActiveDepositPromotion(userId: string) {
  const supabase = createClient()

  try {
    const { data: activePromotion, error } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotion:promotions(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('bonus_amount', 0) // Only promotions that haven't been awarded yet
      .single()

    if (error || !activePromotion) {
      return null
    }

    const promotion = activePromotion.promotion
    if (!promotion || promotion.type !== 'deposit') {
      return null
    }

    return activePromotion

  } catch (error) {
    console.error('Error getting active deposit promotion:', error)
    return null
  }
}

/**
 * Activate a promotion for a user
 */
export async function activatePromotion(userId: string, promotionId: string) {
  const supabase = createClient()

  try {
    // Get promotion details
    const { data: promotion, error: promoError } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', promotionId)
      .eq('is_active', true)
      .single()

    if (promoError || !promotion) {
      throw new Error('Promotion not found or inactive')
    }

    // Check if user already has ANY active promotion (enforce single active promotion rule)
    const { data: anyActivePromotion, error: activeCheckError } = await supabase
      .from('user_promotions')
      .select('id, promotion:promotions(name)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (anyActivePromotion) {
      throw new Error('You already have an active bonus. Please complete or cancel it before activating another.')
    }

    // Check if user already has this specific promotion
    const { data: existingPromotion, error: existingError } = await supabase
      .from('user_promotions')
      .select('*')
      .eq('user_id', userId)
      .eq('promotion_id', promotionId)
      .eq('status', 'active')
      .single()

    if (existingPromotion) {
      throw new Error('Promotion already activated')
    }

    // Create user promotion record with correct schema
    const { data: userPromotion, error: createError } = await supabase
      .from('user_promotions')
      .insert({
        user_id: userId,
        promotion_id: promotionId,
        status: 'active',
        activated_at: new Date().toISOString(),
        bonus_balance: 0,
        wagering_progress: 0,
        winnings_from_bonus: 0,
        bonus_amount: 0,
        wagering_requirement: 0 // Will be set when bonus is awarded
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    return {
      success: true,
      userPromotion,
      message: 'Promotion activated successfully'
    }

  } catch (error) {
    console.error('Error activating promotion:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to activate promotion'
    }
  }
} 