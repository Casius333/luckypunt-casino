import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CoinSide } from '@/types/coin-toss'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    const { betAmount, choice } = await request.json()
    const numAmount = Number(betAmount)
    
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 })
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's wallet with row-level locking
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    // Check sufficient balance
    if (wallet.balance < numAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // First deduct the bet amount
    const { error: deductError } = await supabase
      .from('wallets')
      .update({ 
        balance: wallet.balance - numAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)
      .eq('user_id', user.id)

    if (deductError) {
      return NextResponse.json({ error: 'Failed to place bet' }, { status: 500 })
    }

    // Determine game result
    const result: CoinSide = Math.random() < 0.5 ? 'heads' : 'tails'
    const isWin = choice === result
    const payout = isWin ? numAmount * 2 : 0

    // Create game session
    const { data: session, error: sessionError } = await supabase
      .from('coin_toss_sessions')
      .insert({
        player_id: user.id,
        initial_balance: wallet.balance,
        status: 'active'
      })
      .select()
      .single()

    if (sessionError) {
      return NextResponse.json({ error: 'Failed to create game session' }, { status: 500 })
    }

    // Record the round
    const { error: roundError } = await supabase
      .from('coin_toss_rounds')
      .insert({
        session_id: session.id,
        bet_amount: numAmount,
        player_choice: choice,
        result: result,
        is_win: isWin,
        payout_amount: payout,
        player_balance_before: wallet.balance,
        player_balance_after: isWin ? wallet.balance + payout : wallet.balance - numAmount
      })

    if (roundError) {
      return NextResponse.json({ error: 'Failed to record game round' }, { status: 500 })
    }

    // If player won, add the payout
    if (isWin) {
      const { error: payoutError } = await supabase
        .from('wallets')
        .update({ 
          balance: wallet.balance - numAmount + payout, // Deducted bet + payout
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id)
        .eq('user_id', user.id)

      if (payoutError) {
        return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 })
      }
    }

    // Get final wallet balance
    const { data: finalWallet, error: finalWalletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', wallet.id)
      .single()

    if (finalWalletError) {
      return NextResponse.json({ error: 'Failed to get final balance' }, { status: 500 })
    }

    // Update session stats
    await supabase
      .from('coin_toss_sessions')
      .update({
        total_bets: 1,
        total_wins: isWin ? 1 : 0,
        total_losses: isWin ? 0 : 1,
        net_profit_loss: isWin ? payout - numAmount : -numAmount,
        final_balance: finalWallet.balance,
        end_time: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', session.id)

    return NextResponse.json({
      success: true,
      result,
      isWin,
      payout,
      newBalance: finalWallet.balance
    })
  } catch (error) {
    console.error('Game error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 