import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('=== DEPOSIT BONUS DEBUG ENDPOINT STARTED ===')
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
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

    // Check for active promotions
    const { data: activePromotions, error: promoError } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotions (
          id,
          name,
          type,
          bonus_percent,
          min_deposit_amount,
          max_bonus_amount
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (promoError) {
      console.log('❌ Error fetching promotions:', promoError)
      return NextResponse.json({ 
        error: 'Failed to fetch promotions',
        details: promoError 
      }, { status: 500 })
    }

    console.log('Active promotions found:', activePromotions?.length || 0)

    // Find deposit bonus promotions
    const depositPromotions = activePromotions?.filter(
      up => up.promotions?.type === 'deposit'
    ) || []

    console.log('Deposit promotions found:', depositPromotions.length)

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
      activePromotions: activePromotions?.length || 0,
      depositPromotions: depositPromotions.map(dp => ({
        id: dp.id,
        status: dp.status,
        bonusAwarded: dp.bonus_awarded,
        bonusBalance: dp.bonus_balance,
        wageringRequired: dp.wagering_required,
        promotion: {
          id: dp.promotions?.id,
          name: dp.promotions?.name,
          type: dp.promotions?.type,
          bonusPercent: dp.promotions?.bonus_percent,
          minDeposit: dp.promotions?.min_deposit_amount,
          maxBonus: dp.promotions?.max_bonus_amount
        }
      }))
    }

    console.log('✅ Debug endpoint completed successfully')
    return NextResponse.json(result)

  } catch (error) {
    console.log('❌ Debug endpoint error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error 
    }, { status: 500 })
  }
} 