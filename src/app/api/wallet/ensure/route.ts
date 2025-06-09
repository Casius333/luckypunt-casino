import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Call the secure function to ensure wallet exists
    const { data, error } = await supabase
      .rpc('ensure_user_wallet', {
        user_id: user.id
      })

    if (error) {
      console.error('Error ensuring wallet exists:', error)
      return NextResponse.json({ error: 'Failed to ensure wallet exists' }, { status: 500 })
    }

    return NextResponse.json({ success: true, wallet_id: data })
  } catch (error) {
    console.error('Ensure wallet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 