import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
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
    
    const supabase = createRouteHandlerClient({ cookies })

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
      .from('wallet')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (walletError) {
      console.error('Wallet fetch error:', walletError)
      return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
    }

    const currentBalance = wallet?.balance || 0
    console.log('Current wallet balance:', currentBalance)

    // Update wallet balance
    console.log('Updating wallet balance...')
    const newBalance = currentBalance + numAmount
    const { error: updateError } = await supabase
      .from('wallet')
      .upsert({ 
        user_id: user.id, 
        balance: newBalance 
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
        type: 'deposit',
        amount: numAmount,
        status: 'completed'
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
          max_bonus_amount
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
        up => up.promotions?.type === 'deposit' && up.bonus_awarded === 0
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
          
          const wageringRequired = bonusAmount * 75 // 75x wagering requirement

          console.log('Bonus calculation:', {
            bonusAmount,
            wageringRequired
          })

          // Update user_promotions
          const { error: promoUpdateError } = await supabase
            .from('user_promotions')
            .update({
              bonus_awarded: bonusAmount,
              bonus_balance: bonusAmount,
              wagering_required: wageringRequired
            })
            .eq('id', depositPromo.id)

          if (promoUpdateError) {
            console.error('Promotion update error:', promoUpdateError)
          } else {
            console.log('✅ Promotion updated with bonus')
          }

          // Add bonus to wallet
          const finalBalance = newBalance + bonusAmount
          const { error: bonusWalletError } = await supabase
            .from('wallet')
            .update({ balance: finalBalance })
            .eq('user_id', user.id)

          if (bonusWalletError) {
            console.error('Bonus wallet update error:', bonusWalletError)
          } else {
            console.log('✅ Bonus added to wallet. Final balance:', finalBalance)
          }

          // Record bonus transaction
          const { error: bonusTxError } = await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              type: 'bonus',
              amount: bonusAmount,
              status: 'completed'
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
        console.log('No eligible deposit promotions found')
      }
    }

    // Get final wallet balance
    const { data: finalWallet } = await supabase
      .from('wallet')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    console.log('=== DEPOSIT ROUTE COMPLETED ===')
    return NextResponse.json({ 
      success: true, 
      balance: finalWallet?.balance || newBalance 
    })

  } catch (error) {
    console.error('Deposit route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 