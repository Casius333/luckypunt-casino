import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { applyDepositBonus } from '@/lib/promotionUtils'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the deposit amount from the request body
    const { amount } = await request.json()
    const depositAmount = Number(amount)
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 })
    }
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Processing deposit for user:', user.id, 'Amount:', depositAmount)

    // Get current wallet - using correct schema
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (walletError && walletError.code !== 'PGRST116') {
      console.error('Error fetching wallet:', walletError)
      return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
    }

    let currentWallet = wallet
    let currentBalance = 0

    if (currentWallet) {
      console.log('Updating existing wallet. Current balance:', currentWallet.balance)
      currentBalance = currentWallet.balance || 0
      
      // Update existing wallet with correct schema - use updated_at instead of last_updated
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: currentBalance + depositAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentWallet.id)

      if (updateError) {
        console.error('Error updating wallet:', updateError)
        return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 })
      }
    } else {
      // Create new wallet with correct schema
      const { error: insertError } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          balance: depositAmount,
          currency: 'AUD'
        })

      if (insertError) {
        console.error('Error creating wallet:', insertError)
        return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 })
      }
    }

    // Record transaction with correct schema
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        wallet_id: currentWallet?.id,
        type: 'test_deposit',
        amount: depositAmount,
        currency: 'AUD',
        status: 'completed',
        reference_id: `test_${Date.now()}`,
        metadata: {
          description: 'Test deposit for bonus testing',
          deposit_type: 'test'
        }
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
      // Don't fail the request, just log the error
    }

    console.log('Successfully updated wallet. New balance:', currentBalance + depositAmount)

    // Apply deposit bonus if user has an active promotion
    const bonusResult = await applyDepositBonus(user.id, depositAmount)
    
    let responseMessage = 'Test deposit processed successfully'
    let finalBalance = currentBalance + depositAmount
    
    if (bonusResult.success) {
      responseMessage = bonusResult.message
      finalBalance += bonusResult.bonusAmount || 0
      console.log('✅ Deposit bonus applied:', bonusResult.bonusAmount || 0)
    } else {
      console.log('ℹ️ No deposit bonus applied:', bonusResult.message)
    }

    return NextResponse.json({ 
      success: true, 
      newBalance: finalBalance,
      message: responseMessage,
      bonusApplied: bonusResult.success,
      bonusAmount: bonusResult.bonusAmount || 0
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 