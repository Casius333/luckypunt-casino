import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { amount } = await request.json()
    
    // Create authenticated client for getting user
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (!user) {
      console.error('No user found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Processing withdrawal for user:', user.id)

    // Create admin client for database operations
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    )

    // First try to get the wallet
    const { data: wallet, error: walletError } = await adminClient
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (walletError && walletError.code !== 'PGRST116') { // Not found error
      console.error('Wallet fetch error:', walletError)
      return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
    }

    // If wallet doesn't exist, create profile and wallet
    if (!wallet) {
      console.log('Creating new wallet for user:', user.id)
      
      // Create or update profile first
      const { error: profileError } = await adminClient
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          username: user.email?.split('@')[0] || 'user'
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }

      // Create wallet with 0 balance
      const { data: newWallet, error: createWalletError } = await adminClient
        .from('wallets')
        .insert({
          user_id: user.id,
          currency: 'AUD',
          balance: 0
        })
        .select()
        .single()

      if (createWalletError) {
        console.error('Error creating wallet:', createWalletError)
        return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 })
      }

      console.log('Insufficient funds for new wallet')
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
    }

    // Check if wallet has sufficient funds
    if (wallet.balance < amount) {
      console.log('Insufficient funds. Current balance:', wallet.balance, 'Requested amount:', amount)
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
    }

    console.log('Updating existing wallet. Current balance:', wallet.balance)
    
    // Update existing wallet
    const { data: updatedWallet, error: updateError } = await adminClient
      .from('wallets')
      .update({ balance: wallet.balance - amount })
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating wallet:', updateError)
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })
    }

    console.log('Successfully updated wallet. New balance:', updatedWallet.balance)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Test withdrawal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 