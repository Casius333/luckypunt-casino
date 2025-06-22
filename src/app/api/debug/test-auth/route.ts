import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('=== TEST AUTH ENDPOINT STARTED ===')
  
  try {
    const supabase = createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ User authentication failed:', authError)
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError 
      }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Get wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallet')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (walletError) {
      console.log('❌ Error fetching wallet:', walletError)
    }

    const result = {
      user: {
        id: user.id,
        email: user.email
      },
      wallet: {
        balance: wallet?.balance || 0
      },
      authenticated: true
    }

    console.log('✅ Test auth endpoint completed successfully')
    return NextResponse.json(result)

  } catch (error) {
    console.log('❌ Test auth endpoint error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error 
    }, { status: 500 })
  }
} 