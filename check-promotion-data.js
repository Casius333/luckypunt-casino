const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://lexsfcrpmzgadmbwnrwp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxleHNmY3JwbXpnYWRtYnducndwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODkwNDE2NCwiZXhwIjoyMDY0NDgwMTY0fQ.m3LDMgSODLVslfDH-EgPZpxT5wcqGFxdefYJearvXro';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPromotionData() {
  console.log('=== CHECKING PROMOTION DATA ===\n');

  try {
    // Check the promotions table directly
    console.log('1. Checking promotions table...');
    const { data: promotions, error: promoError } = await supabase
      .from('promotions')
      .select('*')
      .eq('type', 'deposit');

    if (promoError) {
      console.log('❌ Promotions error:', promoError);
      return;
    }

    console.log('✅ Promotions found:', promotions.length);
    promotions.forEach(promo => {
      console.log(`   - ${promo.name}`);
      console.log(`     Type: ${promo.type}`);
      console.log(`     Bonus percent: ${promo.bonus_percent}%`);
      console.log(`     Min deposit: $${promo.min_deposit}`);
      console.log(`     Max bonus: $${promo.max_bonus}`);
      console.log(`     Wagering multiplier: ${promo.wagering_multiplier}`);
      console.log(`     Max withdrawal: $${promo.max_withdrawal_amount}`);
      console.log('');
    });

    // Check user_promotions for the specific user
    console.log('2. Checking user_promotions for user b8602d62-1e9b-4273-be98-05668a3cb9bd...');
    const { data: userPromotions, error: userPromoError } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotions (*)
      `)
      .eq('user_id', 'b8602d62-1e9b-4273-be98-05668a3cb9bd')
      .eq('status', 'active');

    if (userPromoError) {
      console.log('❌ User promotions error:', userPromoError);
      return;
    }

    console.log('✅ User promotions found:', userPromotions.length);
    userPromotions.forEach(userPromo => {
      console.log(`   - User promotion ID: ${userPromo.id}`);
      console.log(`     Status: ${userPromo.status}`);
      console.log(`     Bonus awarded: $${userPromo.bonus_awarded}`);
      console.log(`     Bonus balance: $${userPromo.bonus_balance}`);
      console.log(`     Wagering required: $${userPromo.wagering_required}`);
      console.log(`     Promotion: ${userPromo.promotions.name}`);
      console.log(`     Promotion min deposit: $${userPromo.promotions.min_deposit}`);
      console.log(`     Promotion max bonus: $${userPromo.promotions.max_bonus}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkPromotionData(); 