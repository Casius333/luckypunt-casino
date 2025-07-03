import { createClient } from '@supabase/supabase-js'
import { 
  NormalizedTransaction, 
  BetProcessingResult, 
  WageringContribution,
  DEFAULT_CONTRIBUTION_RATES,
  GAMING_ERROR_CODES 
} from '@/types/gaming'

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Store processed transaction IDs to prevent duplicates
const processedTransactions = new Set<string>()

/**
 * Process a normalized transaction from any gaming provider
 */
export async function processGameTransaction(
  transaction: NormalizedTransaction
): Promise<BetProcessingResult> {
  try {
    // Check for duplicate transaction
    if (processedTransactions.has(transaction.transactionId)) {
      return {
        success: false,
        newBalance: 0,
        error: `Duplicate transaction: ${transaction.transactionId}`,
        transactionId: transaction.transactionId
      }
    }

    // Route to appropriate handler based on transaction type
    switch (transaction.type) {
      case 'bet':
        return await processBet(transaction)
      case 'win':
        return await processWin(transaction)
      case 'rollback':
        return await processRollback(transaction)
      case 'balance':
        return await getBalance(transaction.userId)
      default:
        return {
          success: false,
          newBalance: 0,
          error: `Unknown transaction type: ${transaction.type}`
        }
    }
  } catch (error) {
    console.error('Error processing game transaction:', error)
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Process a bet transaction
 */
async function processBet(transaction: NormalizedTransaction): Promise<BetProcessingResult> {
  const { userId, amount, transactionId, gameId, sessionId } = transaction

  // Get user's wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (walletError || !wallet) {
    return {
      success: false,
      newBalance: 0,
      error: 'Wallet not found',
      transactionId
    }
  }

  // Check available balance (use locked_balance if exists, otherwise balance)
  const availableBalance = wallet.locked_balance > 0 ? wallet.locked_balance : wallet.balance
  
  if (availableBalance < amount) {
    return {
      success: false,
      newBalance: availableBalance,
      error: 'Insufficient funds',
      transactionId
    }
  }

  // Get game information for wagering contribution
  const gameContribution = await getGameWageringContribution(gameId, amount)

  // Get active promotions for wagering progress
  const { data: activePromotions, error: promoError } = await supabase
    .from('user_promotions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (promoError) {
    console.error('Error fetching active promotions:', promoError)
  }

  // Update wallet balance
  let newBalance: number
  let newLockedBalance: number = wallet.locked_balance

  if (wallet.locked_balance > 0) {
    // Funds are locked during promotion - deduct from locked balance
    newLockedBalance = wallet.locked_balance - amount
    newBalance = wallet.balance // Keep balance unchanged
  } else {
    // Normal operation - deduct from balance
    newBalance = wallet.balance - amount
  }

  const { error: walletUpdateError } = await supabase
    .from('wallets')
    .update({
      balance: newBalance,
      locked_balance: newLockedBalance,
      last_updated: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (walletUpdateError) {
    console.error('Error updating wallet:', walletUpdateError)
    return {
      success: false,
      newBalance: availableBalance,
      error: 'Failed to update wallet',
      transactionId
    }
  }

  // Record the transaction
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      wallet_id: wallet.id,
      type: 'bet',
      amount: -amount, // Negative for bet
      currency: wallet.currency,
      status: 'completed',
      reference_id: transactionId,
      metadata: {
        provider: transaction.provider,
        game_id: gameId,
        session_id: sessionId,
        round_id: transaction.roundId,
        raw_transaction: transaction.raw
      }
    })

  if (txError) {
    console.error('Error recording transaction:', txError)
    // Don't fail the bet if transaction recording fails
  }

  // Update wagering progress for active promotions
  let totalWageringProgress = 0
  if (activePromotions && activePromotions.length > 0 && gameContribution) {
    for (const promotion of activePromotions) {
      const newProgress = promotion.wagering_progress + gameContribution.contributionAmount
      
      const { error: progressError } = await supabase
        .from('user_promotions')
        .update({
          wagering_progress: newProgress,
          updated_at: new Date().toISOString()
        })
        .eq('id', promotion.id)

      if (progressError) {
        console.error('Error updating wagering progress:', progressError)
      } else {
        totalWageringProgress += gameContribution.contributionAmount
        
        // Check if promotion is completed
        if (newProgress >= promotion.wagering_requirement) {
          await completePromotion(promotion.id, userId)
        }
      }
    }
  }

  // Mark transaction as processed
  processedTransactions.add(transactionId)

  return {
    success: true,
    newBalance: wallet.locked_balance > 0 ? newLockedBalance : newBalance,
    lockedBalance: newLockedBalance,
    wageringProgress: totalWageringProgress,
    transactionId
  }
}

/**
 * Process a win transaction
 */
async function processWin(transaction: NormalizedTransaction): Promise<BetProcessingResult> {
  const { userId, amount, transactionId, gameId, sessionId } = transaction

  // Get user's wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (walletError || !wallet) {
    return {
      success: false,
      newBalance: 0,
      error: 'Wallet not found',
      transactionId
    }
  }

  // Add winnings to appropriate balance
  let newBalance: number = wallet.balance
  let newLockedBalance: number = wallet.locked_balance

  if (wallet.locked_balance > 0) {
    // Funds are locked during promotion - add to locked balance
    newLockedBalance = wallet.locked_balance + amount
  } else {
    // Normal operation - add to balance
    newBalance = wallet.balance + amount
  }

  const { error: walletUpdateError } = await supabase
    .from('wallets')
    .update({
      balance: newBalance,
      locked_balance: newLockedBalance,
      last_updated: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (walletUpdateError) {
    console.error('Error updating wallet:', walletUpdateError)
    return {
      success: false,
      newBalance: wallet.balance,
      error: 'Failed to update wallet',
      transactionId
    }
  }

  // Record the transaction
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      wallet_id: wallet.id,
      type: 'win',
      amount: amount, // Positive for win
      currency: wallet.currency,
      status: 'completed',
      reference_id: transactionId,
      metadata: {
        provider: transaction.provider,
        game_id: gameId,
        session_id: sessionId,
        round_id: transaction.roundId,
        raw_transaction: transaction.raw
      }
    })

  if (txError) {
    console.error('Error recording transaction:', txError)
  }

  // Mark transaction as processed
  processedTransactions.add(transactionId)

  return {
    success: true,
    newBalance: wallet.locked_balance > 0 ? newLockedBalance : newBalance,
    lockedBalance: newLockedBalance,
    transactionId
  }
}

/**
 * Process a rollback transaction
 */
async function processRollback(transaction: NormalizedTransaction): Promise<BetProcessingResult> {
  const { userId, transactionId } = transaction

  // Find the original transaction to rollback
  const { data: originalTx, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('reference_id', transactionId)
    .eq('user_id', userId)
    .single()

  if (txError || !originalTx) {
    return {
      success: false,
      newBalance: 0,
      error: 'Original transaction not found',
      transactionId
    }
  }

  // Get user's wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (walletError || !wallet) {
    return {
      success: false,
      newBalance: 0,
      error: 'Wallet not found',
      transactionId
    }
  }

  // Reverse the original transaction
  let newBalance: number = wallet.balance
  let newLockedBalance: number = wallet.locked_balance

  if (originalTx.type === 'bet') {
    // Refund the bet amount
    if (wallet.locked_balance > 0) {
      newLockedBalance = wallet.locked_balance + Math.abs(originalTx.amount)
    } else {
      newBalance = wallet.balance + Math.abs(originalTx.amount)
    }
  } else if (originalTx.type === 'win') {
    // Remove the win amount
    if (wallet.locked_balance > 0) {
      newLockedBalance = Math.max(0, wallet.locked_balance - originalTx.amount)
    } else {
      newBalance = Math.max(0, wallet.balance - originalTx.amount)
    }
  }

  const { error: walletUpdateError } = await supabase
    .from('wallets')
    .update({
      balance: newBalance,
      locked_balance: newLockedBalance,
      last_updated: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (walletUpdateError) {
    console.error('Error updating wallet for rollback:', walletUpdateError)
    return {
      success: false,
      newBalance: wallet.balance,
      error: 'Failed to update wallet',
      transactionId
    }
  }

  // Record the rollback transaction
  const { error: rollbackTxError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      wallet_id: wallet.id,
      type: 'rollback',
      amount: -originalTx.amount, // Opposite of original
      currency: wallet.currency,
      status: 'completed',
      reference_id: `rollback_${transactionId}`,
      metadata: {
        original_transaction_id: originalTx.id,
        rollback_reason: 'Provider rollback',
        raw_transaction: transaction.raw
      }
    })

  if (rollbackTxError) {
    console.error('Error recording rollback transaction:', rollbackTxError)
  }

  return {
    success: true,
    newBalance: wallet.locked_balance > 0 ? newLockedBalance : newBalance,
    lockedBalance: newLockedBalance,
    transactionId
  }
}

/**
 * Get user balance for balance queries
 */
async function getBalance(userId: string): Promise<BetProcessingResult> {
  console.log('🔍 getBalance called for userId:', userId)
  console.log('🔍 Supabase URL:', supabaseUrl)
  console.log('🔍 Service key exists:', !!supabaseServiceKey)
  
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  console.log('💰 Wallet data:', wallet)
  console.log('❌ Wallet error:', walletError)

  if (walletError || !wallet) {
    console.log('❌ Wallet not found')
    return {
      success: false,
      newBalance: 0,
      error: 'Wallet not found'
    }
  }

  // Return the appropriate balance (locked balance if promotion active, otherwise regular balance)
  const currentBalance = wallet.locked_balance > 0 ? wallet.locked_balance : wallet.balance
  
  console.log('📊 Balance calculation:')
  console.log('  - wallet.balance:', wallet.balance)
  console.log('  - wallet.locked_balance:', wallet.locked_balance)
  console.log('  - locked_balance > 0?', wallet.locked_balance > 0)
  console.log('  - currentBalance:', currentBalance)

  return {
    success: true,
    newBalance: currentBalance,
    lockedBalance: wallet.locked_balance
  }
}

/**
 * Get wagering contribution for a game and bet amount
 */
async function getGameWageringContribution(
  gameId: string, 
  betAmount: number
): Promise<WageringContribution | null> {
  // In the future, look up game type from database
  // const { data: game } = await supabase
  //   .from('games')
  //   .select('type, contribution_rate')
  //   .eq('id', gameId)
  //   .single()

  // For now, default to slot contribution
  return {
    gameType: 'slot',
    betAmount,
    contributionRate: DEFAULT_CONTRIBUTION_RATES.slot,
    contributionAmount: betAmount * DEFAULT_CONTRIBUTION_RATES.slot
  }
}

/**
 * Complete a promotion when wagering requirements are met
 */
async function completePromotion(promotionId: string, userId: string): Promise<void> {
  try {
    // Mark promotion as completed
    const { error: completeError } = await supabase
      .from('user_promotions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', promotionId)

    if (completeError) {
      console.error('Error completing promotion:', completeError)
      return
    }

    // Convert locked funds to regular balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (walletError || !wallet) {
      console.error('Error fetching wallet for promotion completion:', walletError)
      return
    }

    // Move locked balance to regular balance
    const { error: walletUpdateError } = await supabase
      .from('wallets')
      .update({
        balance: wallet.balance + wallet.locked_balance,
        locked_balance: 0,
        bonus_balance: 0, // Clear bonus balance
        last_updated: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (walletUpdateError) {
      console.error('Error updating wallet for promotion completion:', walletUpdateError)
      return
    }

    console.log(`✅ Promotion ${promotionId} completed for user ${userId}`)
    
    // Record completion transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        type: 'bonus_completion',
        amount: wallet.locked_balance,
        currency: wallet.currency,
        status: 'completed',
        reference_id: `completion_${promotionId}`,
        metadata: {
          promotion_id: promotionId,
          description: 'Bonus wagering requirements completed'
        }
      })

  } catch (error) {
    console.error('Error in completePromotion:', error)
  }
}

/**
 * Clean up old processed transaction IDs (call periodically)
 */
export function cleanupProcessedTransactions(): void {
  processedTransactions.clear()
} 