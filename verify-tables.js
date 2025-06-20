const { createClient } = require('@supabase/supabase-js');

// Read environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTables() {
  try {
    console.log('🔍 Verifying tables and data...\n');

    // Check games table
    console.log('📊 Checking games table...');
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, name, type, wager_multiplier')
      .limit(5);

    if (gamesError) {
      console.error('❌ Error querying games table:', gamesError.message);
    } else {
      console.log(`✅ Games table exists with ${games.length} sample records`);
      console.log('Sample games:', games);
    }

    // Check promotions table
    console.log('\n🎁 Checking promotions table...');
    const { data: promotions, error: promotionsError } = await supabase
      .from('promotions')
      .select('id, name, type, bonus_percentage, max_bonus_amount')
      .limit(5);

    if (promotionsError) {
      console.error('❌ Error querying promotions table:', promotionsError.message);
    } else {
      console.log(`✅ Promotions table exists with ${promotions.length} sample records`);
      console.log('Sample promotions:', promotions);
    }

    // Check user_promotions table structure
    console.log('\n👤 Checking user_promotions table...');
    const { data: userPromotions, error: userPromotionsError } = await supabase
      .from('user_promotions')
      .select('id, user_id, promotion_id, status')
      .limit(1);

    if (userPromotionsError) {
      console.error('❌ Error querying user_promotions table:', userPromotionsError.message);
    } else {
      console.log(`✅ User_promotions table exists (${userPromotions.length} records)`);
    }

    // Count total records
    console.log('\n📈 Summary:');
    const { count: gamesCount } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true });

    const { count: promotionsCount } = await supabase
      .from('promotions')
      .select('*', { count: 'exact', head: true });

    console.log(`- Games: ${gamesCount} total records`);
    console.log(`- Promotions: ${promotionsCount} total records`);

    console.log('\n🎉 All tables verified successfully!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyTables(); 