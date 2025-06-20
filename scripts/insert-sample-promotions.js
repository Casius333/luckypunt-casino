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

async function insertSamplePromotions() {
  console.log('Inserting sample promotions...')

  const samplePromotions = [
    {
      name: 'Welcome Bonus',
      description: 'Get 100% bonus on your first deposit up to $500!',
      bonus_percent: 100,
      max_bonus_amount: 500,
      min_deposit_amount: 20,
      wagering_multiplier: 35,
      max_withdrawal_amount: 1000,
      is_active: true,
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    },
    {
      name: 'Free $10 Bonus',
      description: 'Claim your free $10 bonus - no deposit required!',
      bonus_percent: 0,
      max_bonus_amount: 10,
      min_deposit_amount: 0,
      wagering_multiplier: 50,
      max_withdrawal_amount: 100,
      is_active: true,
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    },
    {
      name: '50% Reload Bonus',
      description: 'Get 50% bonus on deposits between $50 and $200',
      bonus_percent: 50,
      max_bonus_amount: 100,
      min_deposit_amount: 50,
      wagering_multiplier: 25,
      max_withdrawal_amount: 500,
      is_active: true,
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
    },
    {
      name: 'High Roller Bonus',
      description: 'Exclusive 75% bonus for deposits of $500 or more',
      bonus_percent: 75,
      max_bonus_amount: 1000,
      min_deposit_amount: 500,
      wagering_multiplier: 30,
      max_withdrawal_amount: 2000,
      is_active: true,
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days from now
    }
  ]

  try {
    // Insert promotions
    const { data: promotions, error: promoError } = await supabase
      .from('promotions')
      .insert(samplePromotions)
      .select()

    if (promoError) {
      console.error('Error inserting promotions:', promoError)
      return
    }

    console.log(`✅ Successfully inserted ${promotions.length} promotions:`)
    promotions.forEach(promo => {
      console.log(`  - ${promo.name} (${promo.bonus_percent}% bonus)`)
    })

    // Insert sample games if they don't exist
    const sampleGames = [
      {
        provider_id: 1,
        name: 'Lucky Slots',
        type: 'slots',
        provider: 'LuckyPunt',
        image: '/images/games/lucky-slots.jpg',
        wager_multiplier: 1.0,
        is_active: true
      },
      {
        provider_id: 2,
        name: 'Blackjack Pro',
        type: 'table',
        provider: 'LuckyPunt',
        image: '/images/games/blackjack-pro.jpg',
        wager_multiplier: 0.5,
        is_active: true
      },
      {
        provider_id: 3,
        name: 'Roulette Royale',
        type: 'table',
        provider: 'LuckyPunt',
        image: '/images/games/roulette-royale.jpg',
        wager_multiplier: 0.5,
        is_active: true
      },
      {
        provider_id: 4,
        name: 'Plinko Deluxe',
        type: 'plinko',
        provider: 'LuckyPunt',
        image: '/images/games/plinko-deluxe.jpg',
        wager_multiplier: 0.1,
        is_active: true
      }
    ]

    // Check if games table exists and insert sample games
    const { data: existingGames, error: gamesCheckError } = await supabase
      .from('games')
      .select('id')
      .limit(1)

    if (gamesCheckError && gamesCheckError.code === 'PGRST116') {
      console.log('Games table does not exist, skipping games insertion')
    } else {
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .insert(sampleGames)
        .select()

      if (gamesError) {
        console.error('Error inserting games:', gamesError)
      } else {
        console.log(`✅ Successfully inserted ${games.length} sample games`)
      }
    }

    console.log('\n🎉 Sample data insertion complete!')
    console.log('You can now test the promotions system at /promotions')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

insertSamplePromotions() 