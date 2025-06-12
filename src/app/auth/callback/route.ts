import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      await supabase.auth.exchangeCodeForSession(code)
      
      // Get the user after exchanging the code
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      
      if (!user) {
        console.error('No user found after code exchange')
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent('Authentication failed')}`, requestUrl.origin)
        )
      }

      // Ensure wallet exists for the user
      const { error: walletError } = await supabase
        .rpc('ensure_user_wallet', { user_id: user.id })
      
      if (walletError) {
        console.error('Wallet creation error:', walletError)
        // Don't redirect on wallet error, just log it
      }

      return NextResponse.redirect(new URL('/', requestUrl.origin))
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Internal server error')}`, requestUrl.origin)
      )
    }
  }

  // Return the user to an error page if code is not present
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent('No code in URL')}`, requestUrl.origin)
  )
} 