import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { amount } = await request.json()
    const numAmount = Number(amount)
    console.log('Processing deposit request:', { amount, numAmount })
    
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }
    
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (!user) {
      console.error('No user found in session')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('User authenticated:', { userId: user.id })

    // Get or create wallet
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (walletError && walletError.code !== 'PGRST116') { // Not found error
      console.error('Wallet fetch error:', walletError)
      return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
    }

    // If wallet doesn't exist, create it
    if (!wallet) {
      console.log('Creating new wallet for user:', user.id)
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          currency: 'AUD',
          balance: 0,
          locked_balance: 0
        })
        .select()
        .single()

      if (createError) {
        console.error('Wallet creation error:', createError)
        return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 })
      }
      wallet = newWallet
    }

    console.log('Current wallet state:', wallet)

    // Create transaction first
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        wallet_id: wallet.id,
        type: 'test_deposit',
        amount: numAmount,
        currency: 'AUD',
        status: 'completed',
        reference_id: `test_${Date.now()}`,
        metadata: {
          deposit_type: 'test',
          description: 'Test deposit for development'
        }
      })

    if (transactionError) {
      console.error('Transaction creation error:', transactionError)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    // Calculate new balance
    const currentBalance = Number(wallet.balance) || 0
    const newBalance = currentBalance + numAmount
    console.log('Balance calculation:', { currentBalance, numAmount, newBalance })

    // Update wallet balance
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)
      .eq('user_id', user.id) // Extra safety check
      .select()
      .single()

    if (updateError) {
      console.error('Balance update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update balance',
        details: updateError
      }, { status: 500 })
    }

    console.log('Deposit successful, updated wallet:', updatedWallet)
    return NextResponse.json({ 
      success: true,
      balance: newBalance
    })
  } catch (error) {
    console.error('Unexpected deposit error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: error
    }, { status: 500 })
  }
} 