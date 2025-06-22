const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPromotionDates() {
  console.log('🔍 Checking promotion dates...\n');

  const now = new Date().toISOString();
  console.log('Current time:', now);

  try {
    // Get all deposit bonus promotions
    const { data: allPromotions, error: allError } = await supabase
      .from('promotions')
      .select('*')
      .eq('type', 'deposit_bonus');

    if (allError) {
      console.error('❌ Error fetching promotions:', allError);
      return;
    }

    console.log(`Found ${allPromotions.length} deposit bonus promotions:\n`);

    allPromotions.forEach((promo, index) => {
      console.log(`Promotion ${index + 1}:`);
      console.log(`- Name: ${promo.name}`);
      console.log(`- Type: ${promo.type}`);
      console.log(`- Active: ${promo.is_active}`);
      console.log(`- Start: ${promo.start_at}`);
      console.log(`- End: ${promo.end_at}`);
      
      const startDate = new Date(promo.start_at);
      const endDate = new Date(promo.end_at);
      const currentDate = new Date();
      
      const isStarted = currentDate >= startDate;
      const isEnded = currentDate > endDate;
      const isActive = promo.is_active && isStarted && !isEnded;
      
      console.log(`- Is Started: ${isStarted}`);
      console.log(`- Is Ended: ${isEnded}`);
      console.log(`- Is Active: ${isActive}`);
      console.log('');
    });

    // Test the exact query from the test script
    console.log('Testing exact query from test script:');
    const { data: testQueryPromotions, error: testError } = await supabase
      .from('promotions')
      .select('*')
      .eq('type', 'deposit_bonus')
      .eq('is_active', true)
      .gte('start_at', now)
      .lte('end_at', now);

    if (testError) {
      console.error('❌ Test query error:', testError);
      return;
    }

    console.log(`Test query found ${testQueryPromotions.length} promotions`);
    testQueryPromotions.forEach(promo => {
      console.log(`- ${promo.name}`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPromotionDates().catch(console.error); 