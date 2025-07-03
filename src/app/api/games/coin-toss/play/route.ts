import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { CoinSide } from '@/types/coin-toss'
import { processGameTransaction } from '@/lib/gaming/transactionSystem'
import { NormalizedTransaction } from '@/types/gaming'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
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

    // Generate unique transaction and session IDs
    const sessionId = `coin_toss_${Date.now()}_${user.id.slice(0, 8)}`
    const betTransactionId = `bet_${sessionId}`
    const winTransactionId = `win_${sessionId}`

    // Create bet transaction
    const betTransaction: NormalizedTransaction = {
      userId: user.id,
      sessionId,
      provider: 'test',
      gameId: 'coin-toss',
      transactionId: betTransactionId,
      type: 'bet',
      amount: numAmount,
      timestamp: new Date().toISOString(),
      raw: { betAmount: numAmount, choice, gameType: 'coin-toss' }
    }

    // Process the bet
    console.log('Processing coin toss bet:', betTransaction)
    const betResult = await processGameTransaction(betTransaction)
    
    if (!betResult.success) {
      console.error('Bet processing failed:', betResult.error)
      return NextResponse.json({ error: betResult.error }, { status: 400 })
    }

    console.log('Bet processed successfully, new balance:', betResult.newBalance)

    // Determine game result
    const result: CoinSide = Math.random() < 0.5 ? 'heads' : 'tails'
    const isWin = choice === result
    const payout = isWin ? numAmount * 2 : 0

    console.log('Game result:', { result, choice, isWin, payout })

    // Create game session record for tracking
    const { data: session, error: sessionError } = await supabase
      .from('coin_toss_sessions')
      .insert({
        player_id: user.id,
        initial_balance: betResult.newBalance + numAmount, // Balance before bet
        status: 'active'
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Failed to create game session:', sessionError)
      // Don't fail the game if session recording fails
    }

    let finalBalance = betResult.newBalance

    // If player won, process win transaction
    if (isWin && payout > 0) {
      const winTransaction: NormalizedTransaction = {
        userId: user.id,
        sessionId,
        provider: 'test',
        gameId: 'coin-toss',
        transactionId: winTransactionId,
        type: 'win',
        amount: payout,
        timestamp: new Date().toISOString(),
        raw: { payout, result, choice, gameType: 'coin-toss' }
      }

      console.log('Processing coin toss win:', winTransaction)
      const winResult = await processGameTransaction(winTransaction)
      
      if (winResult.success) {
        finalBalance = winResult.newBalance
        console.log('Win processed successfully, final balance:', finalBalance)
      } else {
        console.error('Win processing failed:', winResult.error)
        // Continue with the game even if win recording fails
      }
    }

    // Record the round for game history
    if (session) {
      const { error: roundError } = await supabase
        .from('coin_toss_rounds')
        .insert({
          session_id: session.id,
          bet_amount: numAmount,
          player_choice: choice,
          result: result,
          is_win: isWin,
          payout_amount: payout,
          player_balance_before: betResult.newBalance + numAmount,
          player_balance_after: finalBalance
        })

      if (roundError) {
        console.error('Failed to record game round:', roundError)
        // Don't fail the game if round recording fails
      }

      // Update session stats
      await supabase
        .from('coin_toss_sessions')
        .update({
          total_bets: 1,
          total_wins: isWin ? 1 : 0,
          total_losses: isWin ? 0 : 1,
          net_profit_loss: isWin ? payout - numAmount : -numAmount,
          final_balance: finalBalance,
          end_time: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', session.id)
    }

    return NextResponse.json({
      success: true,
      result,
      isWin,
      payout,
      newBalance: finalBalance,
      wageringProgress: betResult.wageringProgress || 0
    })

  } catch (error) {
    console.error('Coin toss game error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 