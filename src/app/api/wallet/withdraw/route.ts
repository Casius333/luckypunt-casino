import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { amount } = await request.json()
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (walletError) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    // Check if user has any active promotions (block withdrawals during promotions)
    const { data: activePromotions, error: promoError } = await supabase
      .from('user_promotions')
      .select('id, promotion:promotions(name)')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (promoError) {
      console.error('Error checking active promotions:', promoError)
      return NextResponse.json({ error: 'Failed to check promotions' }, { status: 500 })
    }

    if (activePromotions && activePromotions.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot withdraw while promotion is active. Please complete or cancel your active promotion first.' 
      }, { status: 400 })
    }

    // Check sufficient balance
    if (wallet.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        wallet_id: wallet.id,
        type: 'withdrawal',
        amount: amount,
        currency: 'AUD',
        status: 'pending',
        metadata: { method: 'direct' }
      })

    if (transactionError) {
      return NextResponse.json({ error: 'Transaction failed' }, { status: 500 })
    }

    // Update wallet balance
    const { error: updateError } = await supabase.rpc(
      'update_wallet_balance',
      { 
        p_wallet_id: wallet.id,
        p_amount: amount,
        p_type: 'withdraw'
      }
    )

    if (updateError) {
      return NextResponse.json({ error: 'Balance update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 