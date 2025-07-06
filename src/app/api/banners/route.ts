import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  console.log('=== BANNER API CALLED ===')
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const bannerType = searchParams.get('type')
    const activeOnly = searchParams.get('active') === 'true'

    console.log('Query parameters:', { bannerType, activeOnly })

    // Build query
    let query = supabase
      .from('banner_images')
      .select('*')
      .order('display_order', { ascending: true })

    // Filter by banner type if provided
    if (bannerType) {
      query = query.eq('banner_id', bannerType)
    }

    // Filter by active status if requested
    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    console.log('Fetching banners...')
    const { data: banners, error: bannersError } = await query

    if (bannersError) {
      console.error('Banner fetch error:', bannersError)
      return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
    }

    console.log(`✅ Found ${banners?.length || 0} banners`)

    return NextResponse.json({
      success: true,
      banners: banners || [],
      count: banners?.length || 0
    })

  } catch (error) {
    console.error('Banner API exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to check API status
export async function OPTIONS() {
  return NextResponse.json({
    status: 'ok',
    message: 'Banner API endpoint active',
    timestamp: new Date().toISOString(),
    supportedTypes: ['main-web', 'main-mobile', 'promotion-web', 'promotion-mobile']
  })
} 