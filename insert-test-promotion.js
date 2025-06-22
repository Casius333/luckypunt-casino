const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertTestPromotion() {
  console.log('🚀 Inserting test deposit bonus promotion...\n');

  try {
    const { data, error } = await supabase
      .from('promotions')
      .insert({
        name: 'Test Deposit Bonus',
        description: '100% up to $100, 25x wagering requirement',
        type: 'deposit_bonus',
        is_active: true,
        bonus_percent: 100,  // 100% bonus
        max_bonus_amount: 100,  // Max $100 bonus
        min_deposit_amount: 10,  // Min $10 deposit
        wagering_multiplier: 25,  // 25x wagering requirement
        max_withdrawal_amount: 1000,  // Max withdrawal amount
        start_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),  // Started yesterday
        end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()  // Ends in 7 days
      })
      .select();

    if (error) {
      console.error('❌ Error inserting promotion:', error);
      return;
    }

    console.log('✅ Test promotion inserted successfully!');
    console.log('📋 Promotion details:');
    console.log(JSON.stringify(data[0], null, 2));

    // Verify it's active and available
    const { data: activePromotions, error: checkError } = await supabase
      .from('promotions')
      .select('*')
      .eq('type', 'deposit_bonus')
      .eq('is_active', true)
      .gte('start_at', new Date().toISOString())
      .lte('end_at', new Date().toISOString());

    if (checkError) {
      console.error('❌ Error checking active promotions:', checkError);
      return;
    }

    console.log(`\n🎯 Found ${activePromotions.length} active deposit bonus promotions`);
    if (activePromotions.length > 0) {
      console.log('📊 Active promotions:');
      activePromotions.forEach((promo, index) => {
        console.log(`${index + 1}. ${promo.name} - ${promo.bonus_percent}% up to $${promo.max_bonus_amount}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

insertTestPromotion(); 