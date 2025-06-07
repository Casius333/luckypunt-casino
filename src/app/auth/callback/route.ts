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
      
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        )
      }

      // After successful confirmation, get the user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Create or update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            username: user.email
          }, {
            onConflict: 'id'
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
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
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    return NextResponse.redirect(new URL('/', requestUrl.origin))
  } catch (error) {
    console.error('Callback route error:', error)
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }
} 