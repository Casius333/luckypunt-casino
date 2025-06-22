import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // First enable RLS bypass for this operation
    await supabase.rpc('set_claim', { claim: 'is_admin', value: true })

    try {
      // Create or update profile first
      const { error: profileError } = await supabase
        .from('players')
        .upsert({
          id: user.id,
          email: user.email,
          username: user.email?.split('@')[0] || 'user'
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }

      // Create wallet if it doesn't exist
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
        console.error('Error creating wallet:', walletError)
        return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } finally {
      // Always disable RLS bypass when done
      await supabase.rpc('set_claim', { claim: 'is_admin', value: false })
    }
  } catch (error) {
    console.error('Create wallet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}