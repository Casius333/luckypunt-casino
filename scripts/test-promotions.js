const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testPromotions() {
  console.log('Testing promotions data access...')

  try {
    // Test fetching promotions
    const { data: promotions, error: promoError } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (promoError) {
      console.error('Error fetching promotions:', promoError)
      return
    }

    console.log(`✅ Found ${promotions.length} active promotions:`)
    promotions.forEach(promo => {
      console.log(`  - ${promo.name} (${promo.bonus_percent}% bonus, min deposit: $${promo.min_deposit_amount})`)
    })

    // Test fetching games
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)

    if (gamesError) {
      console.error('Error fetching games:', gamesError)
    } else {
      console.log(`✅ Found ${games.length} active games:`)
      games.forEach(game => {
        console.log(`  - ${game.name} (${game.type}, multiplier: ${game.wager_multiplier})`)
      })
    }

    // Test user_promotions table structure
    const { data: userPromos, error: userPromoError } = await supabase
      .from('user_promotions')
      .select('*')
      .limit(1)

    if (userPromoError) {
      console.error('Error testing user_promotions table:', userPromoError)
    } else {
      console.log('✅ user_promotions table is accessible')
    }

    console.log('\n🎉 Database connection and data access test successful!')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testPromotions() 