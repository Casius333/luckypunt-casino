import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Remove edge runtime to fix connection issues
// export const runtime = 'edge'

export async function GET(request: NextRequest) {
  console.log('=== BANNER API CALLED ===')
  try {
    console.log('Environment check:')
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...')
    console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    // Use service role key for API routes (banners are public content)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Note: Banners are public content, no authentication required
    console.log('Fetching public banners...')

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const bannerType = searchParams.get('type')
    const activeOnly = searchParams.get('active') === 'true'

    console.log('Query parameters:', { bannerType, activeOnly })

    // Start with a simple query first
    console.log('Testing basic connection...')
    let query = supabase
      .from('banner_images')
      .select('id, banner_id, is_active')
      .limit(3)

    console.log('Executing basic query...')
    const { data: testData, error: testError } = await query

    if (testError) {
      console.error('Basic query error:', testError)
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError.message,
        code: testError.code 
      }, { status: 500 })
    }

    console.log('✅ Basic connection works! Found', testData?.length, 'records')

    // Now build the full query
    let fullQuery = supabase
      .from('banner_images')
      .select('*')
      .order('display_order', { ascending: true })

    // Filter by banner type if provided
    if (bannerType) {
      fullQuery = fullQuery.eq('banner_id', bannerType)
    }

    // Filter by active status if requested
    if (activeOnly) {
      fullQuery = fullQuery.eq('is_active', true)
    }

    // For promotional banners, filter by current day of week
    if (bannerType?.includes('promotion')) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const currentDay = dayNames[new Date().getDay()]
      
      console.log(`Filtering promotional banners for day: ${currentDay}`)
      
      // Fix: Use proper PostgreSQL array contains syntax
      fullQuery = fullQuery.contains('schedule_days', [currentDay])
      fullQuery = fullQuery.eq('is_day_scheduled', true)
    }

    console.log('Fetching filtered banners...')
    const { data: banners, error: bannersError } = await fullQuery

    if (bannersError) {
      console.error('Banner fetch error:', bannersError)
      return NextResponse.json({ 
        error: 'Failed to fetch banners', 
        details: bannersError.message,
        code: bannersError.code 
      }, { status: 500 })
    }

    console.log(`✅ Found ${banners?.length || 0} banners`)
    if (banners?.length > 0) {
      console.log('Banner sample:', banners[0])
    }

    return NextResponse.json({
      success: true,
      banners: banners || [],
      count: banners?.length || 0
    })

  } catch (error) {
    console.error('Banner API exception:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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