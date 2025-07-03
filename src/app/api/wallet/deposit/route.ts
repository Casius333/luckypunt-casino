import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('=== DEPOSIT ROUTE CALLED ===')
  try {
    const { amount } = await request.json()
    const numAmount = Number(amount)
    console.log('Processing deposit request:', { amount, numAmount })
    
    if (isNaN(numAmount) || numAmount <= 0) {
      console.log('Validation failed: Invalid amount provided.')
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }
    
    const supabase = createServerSupabaseClient()

    console.log('Attempting to get user session...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication failed:', { authError, user })
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Get current wallet balance
    console.log('Fetching current wallet balance...')
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance, currency, locked_balance, bonus_balance')
      .eq('user_id', user.id)
      .single()

    if (walletError) {
      console.error('Wallet fetch error:', walletError)
      return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
    }

    const currentBalance = wallet?.balance || 0
    console.log('Current wallet balance:', currentBalance)

    // Check if user has active promotions first
    console.log('Checking for active promotions before wallet update...')
    const { data: existingPromotions, error: promoCheckError } = await supabase
      .from('user_promotions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (promoCheckError) {
      console.error('Error checking active promotions:', promoCheckError)
      return NextResponse.json({ error: 'Failed to check promotions' }, { status: 500 })
    }

    const hasActivePromotion = existingPromotions && existingPromotions.length > 0

    // Update wallet balance
    console.log('Updating wallet balance...')
    const newBalance = currentBalance + numAmount
    
    let walletUpdate
    if (hasActivePromotion) {
      // If active promotion exists, add to locked balance
      walletUpdate = {
        user_id: user.id,
        balance: 0, // No withdrawable funds during promotion
        locked_balance: (wallet?.locked_balance || 0) + numAmount,
        currency: wallet?.currency || 'AUD',
        updated_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      }
    } else {
      // No active promotion, normal deposit to balance
      walletUpdate = {
        user_id: user.id, 
        balance: newBalance,
        currency: wallet?.currency || 'AUD',
        updated_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      }
    }

    const { error: updateError } = await supabase
      .from('wallets')
      .upsert(walletUpdate, { 
        onConflict: 'user_id' 
      })

    if (updateError) {
      console.error('Wallet update error:', updateError)
      return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 })
    }

    console.log('✅ Wallet updated successfully. New balance:', newBalance)

    // Record deposit transaction
    console.log('Recording deposit transaction...')
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        wallet_id: wallet.id,
        type: 'deposit',
        amount: numAmount,
        currency: wallet?.currency || 'AUD',
        status: 'completed',
        reference_id: `deposit_${Date.now()}`,
        metadata: {
          description: 'User deposit',
          deposit_type: 'user_deposit'
        }
      })

    if (txError) {
      console.error('Transaction recording error:', txError)
      // Don't fail the deposit if transaction recording fails
      console.log('⚠️ Deposit succeeded but transaction recording failed')
    } else {
      console.log('✅ Deposit transaction recorded')
    }

    // Check for active deposit bonus
    console.log('Checking for active deposit bonus...')
    const { data: activePromotions, error: promoError } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotions (
          id,
          name,
          type,
          bonus_percent,
          min_deposit_amount,
          max_bonus_amount,
          wagering_multiplier
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (promoError) {
      console.error('Promotion fetch error:', promoError)
      // Don't fail the deposit if promotion check fails
      console.log('⚠️ Deposit succeeded but promotion check failed')
    } else {
      console.log('Active promotions found:', activePromotions?.length || 0)
      
      // Find deposit bonus promotions
      const depositPromotions = activePromotions?.filter(
        up => up.promotions?.type === 'deposit' && up.bonus_amount === 0
      ) || []

      console.log('Deposit promotions found:', depositPromotions.length)

      if (depositPromotions.length > 0) {
        const depositPromo = depositPromotions[0]
        const promo = depositPromo.promotions

        console.log('Processing deposit bonus:', {
          promotionName: promo.name,
          bonusPercent: promo.bonus_percent,
          minDeposit: promo.min_deposit_amount,
          maxBonus: promo.max_bonus_amount,
          depositAmount: numAmount
        })

        // Check if deposit meets minimum requirement
        if (numAmount >= promo.min_deposit_amount) {
          console.log('✅ Deposit meets minimum requirement')
          
          // Calculate bonus amount
          const bonusAmount = Math.min(
            numAmount * (promo.bonus_percent / 100),
            promo.max_bonus_amount
          )
          
          const wageringRequired = bonusAmount * promo.wagering_multiplier

          console.log('Bonus calculation:', {
            bonusAmount,
            wageringRequired
          })

          // Update user_promotions
          const { error: promoUpdateError } = await supabase
            .from('user_promotions')
            .update({
              deposit_amount: numAmount,
              bonus_amount: bonusAmount,
              bonus_balance: bonusAmount,
              wagering_required: wageringRequired,
              wagering_progress: 0,
              updated_at: new Date().toISOString(),
              last_updated: new Date().toISOString()
            })
            .eq('id', depositPromo.id)

          if (promoUpdateError) {
            console.error('Promotion update error:', promoUpdateError)
          } else {
            console.log('✅ Promotion updated with bonus')
          }

          // Add bonus to wallet with proper fund segregation
          const totalLocked = newBalance + bonusAmount
          const { error: bonusWalletError } = await supabase
            .from('wallets')
            .update({ 
              balance: 0, // No withdrawable funds during active promotion
              bonus_balance: bonusAmount, // Track bonus funds separately
              locked_balance: totalLocked, // Lock all funds during promotion
              updated_at: new Date().toISOString(),
              last_updated: new Date().toISOString()
            })
            .eq('user_id', user.id)

          if (bonusWalletError) {
            console.error('Bonus wallet update error:', bonusWalletError)
          } else {
            console.log('✅ Bonus added to wallet. Total locked:', totalLocked)
          }

          // Record bonus transaction
          const { error: bonusTxError } = await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              wallet_id: wallet.id,
              type: 'deposit_bonus',
              amount: bonusAmount,
              currency: wallet?.currency || 'AUD',
              status: 'completed',
              reference_id: `bonus_${depositPromo.id}`,
              metadata: {
                description: `Deposit bonus from ${promo.name}`,
                deposit_amount: numAmount,
                promotion_id: promo.id,
                user_promotion_id: depositPromo.id
              }
            })

          if (bonusTxError) {
            console.error('Bonus transaction recording error:', bonusTxError)
          } else {
            console.log('✅ Bonus transaction recorded')
          }
        } else {
          console.log('❌ Deposit does not meet minimum requirement')
        }
      } else {
        console.log('No active deposit bonus promotions found')
      }
    }

    return NextResponse.json({ 
      success: true, 
      newBalance: newBalance,
      message: 'Deposit processed successfully'
    })

  } catch (error) {
    console.error('Deposit route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 