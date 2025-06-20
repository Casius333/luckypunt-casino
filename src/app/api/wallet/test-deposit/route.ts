import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Processing deposit for user:', user.id)

    // Get current wallet
    const { data: wallets, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (walletError) {
      console.error('Error fetching wallet:', walletError)
      return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
    }

    let currentWallet = wallets?.[0]
    let currentBalance = 0

    if (currentWallet) {
      console.log('Updating existing wallet. Current balance:', currentWallet.balance)
      currentBalance = currentWallet.balance || 0
      
      // Update existing wallet
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: currentBalance + 100 })
        .eq('id', currentWallet.id)

      if (updateError) {
        console.error('Error updating wallet:', updateError)
        return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 })
      }
    } else {
      // Create new wallet
      const { error: insertError } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          balance: 100,
          currency: 'USD'
        })

      if (insertError) {
        console.error('Error creating wallet:', insertError)
        return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 })
      }
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'deposit',
        amount: 100,
        description: 'Test deposit',
        status: 'completed'
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
      // Don't fail the request, just log the error
    }

    console.log('Successfully updated wallet. New balance:', currentBalance + 100)

    return NextResponse.json({ 
      success: true, 
      newBalance: currentBalance + 100,
      message: 'Test deposit processed successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 