import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'

    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Exchange code for session
      const { error: authError } = await supabase.auth.exchangeCodeForSession(code)
      if (authError) {
        console.error('Auth callback error:', authError)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(authError.message)}`, requestUrl.origin)
        )
      }

      // Get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('Failed to get user:', userError)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent('Failed to get user')}`, requestUrl.origin)
        )
      }

      // Create or update player profile
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
        console.error('Failed to create player profile:', profileError)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent('Failed to create profile')}`, requestUrl.origin)
        )
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
        console.error('Failed to create wallet:', walletError)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent('Failed to create wallet')}`, requestUrl.origin)
        )
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    return NextResponse.redirect(new URL('/', requestUrl.origin))
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Internal server error')}`, requestUrl.origin)
    )
  }
} 