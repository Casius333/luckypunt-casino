import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Create or update player profile first
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
      console.error('Error creating player profile:', profileError)
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
  } catch (error) {
    console.error('Ensure wallet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 