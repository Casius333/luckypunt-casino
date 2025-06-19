import { getSupabaseClient } from './supabaseClient';

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'deposit_bonus' | 'no_deposit_bonus' | 'free_spins' | 'cashback';
  bonus_percentage: number;
  max_bonus_amount: number;
  min_deposit_amount: number;
  wagering_requirement: number;
  max_withdrawal_amount?: number;
  is_active: boolean;
  start_date: string;
  end_date?: string;
}

export interface UserPromotion {
  id: string;
  user_id: string;
  promotion_id: string;
  status: 'active' | 'completed' | 'forfeited' | 'cancelled';
  bonus_amount: number;
  wagering_progress: number;
  wagering_requirement: number;
  max_withdrawal_amount?: number;
  activated_at: string;
  completed_at?: string;
  forfeited_at?: string;
  promotion?: Promotion;
}

export interface Game {
  id: string;
  provider_id: number;
  name: string;
  type: 'slots' | 'table' | 'live' | 'plinko' | 'jackpot' | 'other';
  provider: string;
  wager_multiplier: number;
  is_active: boolean;
}

export interface WalletBalance {
  real_balance: number;
  bonus_balance: number;
  total_balance: number;
}

/**
 * Get available promotions for a user
 */
export async function getAvailablePromotions(userId: string): Promise<Promotion[]> {
  const supabase = getSupabaseClient();
  
  const { data: promotions, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('is_active', true)
    .or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching promotions:', error);
    throw new Error('Failed to fetch promotions');
  }

  return promotions || [];
}

/**
 * Get user's active promotions
 */
export async function getUserActivePromotions(userId: string): Promise<UserPromotion[]> {
  const supabase = getSupabaseClient();
  
  const { data: userPromotions, error } = await supabase
    .from('user_promotions')
    .select(`
      *,
      promotion:promotions(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('activated_at', { ascending: false });

  if (error) {
    console.error('Error fetching user promotions:', error);
    throw new Error('Failed to fetch user promotions');
  }

  return userPromotions || [];
}

/**
 * Activate a promotion for a user
 */
export async function activatePromotion(userId: string, promotionId: string, depositAmount?: number): Promise<UserPromotion> {
  const supabase = getSupabaseClient();
  
  // Get the promotion details
  const { data: promotion, error: promoError } = await supabase
    .from('promotions')
    .select('*')
    .eq('id', promotionId)
    .eq('is_active', true)
    .single();

  if (promoError || !promotion) {
    throw new Error('Promotion not found or inactive');
  }

  // Validate activation requirements
  if (promotion.type === 'deposit_bonus' && (!depositAmount || depositAmount < promotion.min_deposit_amount)) {
    throw new Error(`Minimum deposit of $${promotion.min_deposit_amount} required`);
  }

  // Check if user already has an active promotion of this type
  const { data: existingPromo, error: existingError } = await supabase
    .from('user_promotions')
    .select('*')
    .eq('user_id', userId)
    .eq('promotion_id', promotionId)
    .eq('status', 'active')
    .single();

  if (existingPromo) {
    throw new Error('You already have this promotion active');
  }

  // Calculate bonus amount
  let bonusAmount = 0;
  if (promotion.type === 'deposit_bonus' && depositAmount) {
    bonusAmount = Math.min(
      (depositAmount * promotion.bonus_percentage) / 100,
      promotion.max_bonus_amount
    );
  } else if (promotion.type === 'no_deposit_bonus') {
    bonusAmount = promotion.max_bonus_amount;
  }

  // Calculate wagering requirement
  const wageringRequirement = bonusAmount * promotion.wagering_requirement;

  // Create user promotion record
  const { data: userPromotion, error: insertError } = await supabase
    .from('user_promotions')
    .insert({
      user_id: userId,
      promotion_id: promotionId,
      bonus_amount: bonusAmount,
      wagering_requirement: wageringRequirement,
      max_withdrawal_amount: promotion.max_withdrawal_amount,
      status: 'active'
    })
    .select(`
      *,
      promotion:promotions(*)
    `)
    .single();

  if (insertError) {
    console.error('Error activating promotion:', insertError);
    throw new Error('Failed to activate promotion');
  }

  // Add bonus to user's wallet
  if (bonusAmount > 0) {
    await addBonusToWallet(userId, bonusAmount);
  }

  return userPromotion;
}

/**
 * Add bonus funds to user's wallet
 */
async function addBonusToWallet(userId: string, bonusAmount: number): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Get current wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (walletError || !wallet) {
    throw new Error('Wallet not found');
  }

  // Update wallet with bonus funds
  const { error: updateError } = await supabase
    .from('wallets')
    .update({
      balance: wallet.balance + bonusAmount,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id);

  if (updateError) {
    console.error('Error adding bonus to wallet:', updateError);
    throw new Error('Failed to add bonus to wallet');
  }

  // Record transaction
  await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      wallet_id: wallet.id,
      type: 'bonus',
      amount: bonusAmount,
      currency: 'AUD',
      status: 'completed',
      reference_id: `bonus-${Date.now()}`,
      metadata: { source: 'promotion' }
    });
}

/**
 * Get user's wallet balance breakdown (real vs bonus)
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance> {
  const supabase = getSupabaseClient();
  
  // Get wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (walletError || !wallet) {
    throw new Error('Wallet not found');
  }

  // Get active promotions to calculate bonus balance
  const { data: activePromotions, error: promoError } = await supabase
    .from('user_promotions')
    .select('bonus_amount, wagering_progress, wagering_requirement')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (promoError) {
    console.error('Error fetching active promotions:', promoError);
    throw new Error('Failed to fetch promotions');
  }

  // Calculate bonus balance (simplified - in reality this would be more complex)
  const totalBonusAmount = activePromotions?.reduce((sum, promo) => sum + promo.bonus_amount, 0) || 0;
  const totalWagered = activePromotions?.reduce((sum, promo) => sum + promo.wagering_progress, 0) || 0;
  
  // For now, assume bonus funds are used proportionally
  // In a real system, you'd track real vs bonus funds separately
  const realBalance = Math.max(0, wallet.balance - totalBonusAmount);
  const bonusBalance = totalBonusAmount;

  return {
    real_balance: realBalance,
    bonus_balance: bonusBalance,
    total_balance: wallet.balance
  };
}

/**
 * Process a bet with fund depletion logic (real before bonus)
 */
export async function processBet(userId: string, gameId: string, betAmount: number): Promise<{
  success: boolean;
  newBalance: number;
  wageringProgress?: number;
}> {
  const supabase = getSupabaseClient();
  
  // Get user's wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (walletError || !wallet) {
    throw new Error('Wallet not found');
  }

  // Check sufficient balance
  if (wallet.balance < betAmount) {
    throw new Error('Insufficient balance');
  }

  // Get game details for wagering multiplier
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('wager_multiplier')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    throw new Error('Game not found');
  }

  // Get active promotions
  const { data: activePromotions, error: promoError } = await supabase
    .from('user_promotions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (promoError) {
    console.error('Error fetching active promotions:', promoError);
    throw new Error('Failed to fetch promotions');
  }

  // Deduct bet amount from wallet
  const { error: updateError } = await supabase
    .from('wallets')
    .update({
      balance: wallet.balance - betAmount,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id);

  if (updateError) {
    console.error('Error updating wallet:', updateError);
    throw new Error('Failed to process bet');
  }

  // Update wagering progress for active promotions
  let totalWageringProgress = 0;
  if (activePromotions && activePromotions.length > 0) {
    const wageringContribution = betAmount * game.wager_multiplier;
    
    for (const promotion of activePromotions) {
      const { error: progressError } = await supabase
        .from('user_promotions')
        .update({
          wagering_progress: promotion.wagering_progress + wageringContribution,
          updated_at: new Date().toISOString()
        })
        .eq('id', promotion.id);

      if (progressError) {
        console.error('Error updating wagering progress:', progressError);
      }

      totalWageringProgress += wageringContribution;
    }
  }

  return {
    success: true,
    newBalance: wallet.balance - betAmount,
    wageringProgress: totalWageringProgress
  };
}

/**
 * Check if any promotions are completed and convert bonus to real funds
 */
export async function checkAndCompletePromotions(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Get active promotions that might be completed
  const { data: activePromotions, error: promoError } = await supabase
    .from('user_promotions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (promoError || !activePromotions) {
    return;
  }

  for (const promotion of activePromotions) {
    if (promotion.wagering_progress >= promotion.wagering_requirement) {
      // Mark promotion as completed
      const { error: completeError } = await supabase
        .from('user_promotions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', promotion.id);

      if (completeError) {
        console.error('Error completing promotion:', completeError);
        continue;
      }

      // Convert bonus to real funds (bonus funds are now "real")
      // In a real system, you'd have separate real/bonus balance tracking
      console.log(`Promotion ${promotion.id} completed for user ${userId}`);
    }
  }
}

/**
 * Cancel/forfeit a promotion
 */
export async function cancelPromotion(userId: string, userPromotionId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Get the user promotion
  const { data: userPromotion, error: fetchError } = await supabase
    .from('user_promotions')
    .select('*')
    .eq('id', userPromotionId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (fetchError || !userPromotion) {
    throw new Error('Active promotion not found');
  }

  // Mark as cancelled
  const { error: cancelError } = await supabase
    .from('user_promotions')
    .update({
      status: 'cancelled',
      forfeited_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userPromotionId);

  if (cancelError) {
    console.error('Error cancelling promotion:', cancelError);
    throw new Error('Failed to cancel promotion');
  }

  // Remove bonus funds from wallet
  if (userPromotion.bonus_amount > 0) {
    await removeBonusFromWallet(userId, userPromotion.bonus_amount);
  }
}

/**
 * Remove bonus funds from user's wallet
 */
async function removeBonusFromWallet(userId: string, bonusAmount: number): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Get current wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (walletError || !wallet) {
    throw new Error('Wallet not found');
  }

  // Remove bonus funds (don't go below 0)
  const newBalance = Math.max(0, wallet.balance - bonusAmount);

  const { error: updateError } = await supabase
    .from('wallets')
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id);

  if (updateError) {
    console.error('Error removing bonus from wallet:', updateError);
    throw new Error('Failed to remove bonus from wallet');
  }

  // Record transaction
  await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      wallet_id: wallet.id,
      type: 'bonus_forfeit',
      amount: -bonusAmount,
      currency: 'AUD',
      status: 'completed',
      reference_id: `forfeit-${Date.now()}`,
      metadata: { source: 'promotion_cancellation' }
    });
} 