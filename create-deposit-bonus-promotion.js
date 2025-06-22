const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDepositBonusPromotion() {
  console.log('🚀 Creating deposit bonus promotion...\n');

  try {
    // First, check if we already have a deposit bonus promotion
    const { data: existingPromotions, error: checkError } = await supabase
      .from('promotions')
      .select('*')
      .eq('type', 'deposit_bonus')
      .eq('is_active', true);

    if (checkError) {
      console.error('❌ Error checking existing promotions:', checkError);
      return;
    }

    if (existingPromotions && existingPromotions.length > 0) {
      console.log('✅ Deposit bonus promotion already exists:');
      existingPromotions.forEach(promo => {
        console.log(`- ${promo.name}: ${promo.bonus_percent}% up to $${promo.max_bonus_amount}`);
      });
      return;
    }

    // Create new deposit bonus promotion
    const { data: newPromotion, error: createError } = await supabase
      .from('promotions')
      .insert({
        name: 'Test Deposit Bonus',
        description: '100% up to $100, 25x wagering requirement',
        type: 'deposit_bonus',
        is_active: true,
        bonus_percent: 100,
        max_bonus_amount: 100,
        min_deposit_amount: 10,
        wagering_multiplier: 25,
        max_withdrawal_amount: 1000,
        start_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Started yesterday
        end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Ends in 7 days
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating promotion:', createError);
      return;
    }

    console.log('✅ Deposit bonus promotion created successfully:');
    console.log(`- Name: ${newPromotion.name}`);
    console.log(`- Type: ${newPromotion.type}`);
    console.log(`- Bonus: ${newPromotion.bonus_percent}% up to $${newPromotion.max_bonus_amount}`);
    console.log(`- Wagering: ${newPromotion.wagering_multiplier}x`);
    console.log(`- Active: ${newPromotion.is_active}`);
    console.log(`- Start: ${newPromotion.start_at}`);
    console.log(`- End: ${newPromotion.end_at}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createDepositBonusPromotion().catch(console.error); 