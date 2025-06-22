const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkActivePromotions() {
  console.log('🔍 Checking active deposit bonus promotions...\n');

  try {
    const now = new Date().toISOString();
    console.log('Current time:', now);

    // Get all deposit bonus promotions
    const { data: allPromotions, error: allError } = await supabase
      .from('promotions')
      .select('*')
      .eq('type', 'deposit_bonus');

    if (allError) {
      console.error('❌ Error fetching promotions:', allError);
      return;
    }

    console.log(`📊 Found ${allPromotions.length} total deposit bonus promotions:`);
    allPromotions.forEach((promo, index) => {
      const isActive = promo.is_active;
      const isInDateRange = new Date(promo.start_at) <= new Date() && new Date() <= new Date(promo.end_at);
      const status = isActive && isInDateRange ? '✅ ACTIVE' : '❌ INACTIVE';
      console.log(`${index + 1}. ${promo.name} - ${status}`);
      console.log(`   Active: ${isActive}, Date Range: ${isInDateRange}`);
      console.log(`   Start: ${promo.start_at}, End: ${promo.end_at}`);
      console.log(`   Bonus: ${promo.bonus_percent}% up to $${promo.max_bonus_amount}\n`);
    });

    // Filter for truly active promotions
    const activePromotions = allPromotions.filter(promo => 
      promo.is_active && 
      new Date(promo.start_at) <= new Date() && 
      new Date() <= new Date(promo.end_at)
    );

    console.log(`🎯 Found ${activePromotions.length} ACTIVE deposit bonus promotions`);
    if (activePromotions.length > 0) {
      console.log('📋 Active promotions:');
      activePromotions.forEach((promo, index) => {
        console.log(`${index + 1}. ${promo.name} - ${promo.bonus_percent}% up to $${promo.max_bonus_amount}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkActivePromotions(); 