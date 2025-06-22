import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: Request) {
  console.log('=== WALLET ENSURE API CALLED ===')
  try {
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    console.log('Getting authenticated user...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth result:', { user: user?.id, error: authError })
    
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Create or update player profile first
    console.log('Creating/updating player profile...')
    const { error: profileError } = await supabase
      .from('players')
      .upsert({
        id: user.id,
        email: user.email,
        username: user.email
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }
    console.log('✅ Player profile ensured')

    // Create wallet if it doesn't exist
    console.log('Creating/updating wallet...')
    const { error: walletError } = await supabase
      .from('wallets')
      .upsert({
        user_id: user.id,
        currency: 'AUD',
        balance: 0
      }, {
        onConflict: 'user_id'
      })

    if (walletError) {
      console.error('Wallet creation error:', walletError)
      return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 })
    }
    console.log('✅ Wallet ensured')

    console.log('=== WALLET ENSURE API COMPLETED ===')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Wallet ensure exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 