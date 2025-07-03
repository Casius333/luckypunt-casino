import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cancelPromotionWithFundSegregation, calculateFundBreakdown } from '@/lib/fundSegregation'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('=== PROMOTION CANCELLATION REQUESTED ===')
    console.log('User ID:', user.id)

    // Get current fund breakdown before cancellation
    const preBreakdown = await calculateFundBreakdown(supabase, user.id)
    if (!preBreakdown) {
      return NextResponse.json({ error: 'Unable to calculate fund breakdown' }, { status: 400 })
    }

    console.log('Pre-cancellation breakdown:', preBreakdown)

    // Check if there's an active promotion to cancel
    if (preBreakdown.bonusFunds === 0 && preBreakdown.promotionWinnings === 0) {
      return NextResponse.json({ error: 'No active promotion to cancel' }, { status: 400 })
    }

    // Perform the cancellation with fund segregation
    const result = await cancelPromotionWithFundSegregation(supabase, user.id)

    if (!result.success) {
      console.error('Cancellation failed:', result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    console.log('✅ Promotion cancelled successfully')
    console.log('Funds kept:', result.fundsKept)
    console.log('Funds lost:', result.fundsLost)

    return NextResponse.json({
      success: true,
      message: result.message,
      fundsKept: result.fundsKept,
      fundsLost: result.fundsLost,
      preBreakdown
    })

  } catch (error) {
    console.error('Error in promotion cancellation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 