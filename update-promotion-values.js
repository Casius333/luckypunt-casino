const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://lexsfcrpmzgadmbwnrwp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxleHNmY3JwbXpnYWRtYnducndwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODkwNDE2NCwiZXhwIjoyMDY0NDgwMTY0fQ.m3LDMgSODLVslfDH-EgPZpxT5wcqGFxdefYJearvXro';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePromotionValues() {
  console.log('=== UPDATING PROMOTION VALUES ===\n');

  try {
    // First, let's check what columns exist in the promotions table
    console.log('1. Checking promotions table schema...');
    const { data: schemaCheck, error: schemaError } = await supabase
      .from('promotions')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.log('❌ Schema check error:', schemaError);
      return;
    }

    console.log('✅ Available columns:', Object.keys(schemaCheck[0]));

    // Update the 50% Reload Bonus promotion with correct columns
    console.log('\n2. Updating 50% Reload Bonus promotion...');
    const updateData = {
      min_deposit_amount: 10,
      max_bonus_amount: 500
    };

    const { data: updateResult, error: updateError } = await supabase
      .from('promotions')
      .update(updateData)
      .eq('name', '50% Reload Bonus')
      .eq('type', 'deposit')
      .select();

    if (updateError) {
      console.log('❌ Update error:', updateError);
      return;
    }

    console.log('✅ Updated promotions:', updateResult.length);
    updateResult.forEach(promo => {
      console.log(`   - ${promo.name}`);
      console.log(`     Min deposit: $${promo.min_deposit_amount}`);
      console.log(`     Max bonus: $${promo.max_bonus_amount}`);
      console.log(`     Bonus percent: ${promo.bonus_percent}%`);
      console.log(`     Wagering multiplier: ${promo.wagering_multiplier}`);
      console.log('');
    });

    // Verify the update
    console.log('3. Verifying the update...');
    const { data: verifyResult, error: verifyError } = await supabase
      .from('promotions')
      .select('*')
      .eq('name', '50% Reload Bonus')
      .eq('type', 'deposit')
      .single();

    if (verifyError) {
      console.log('❌ Verification error:', verifyError);
      return;
    }

    console.log('✅ Verification successful:');
    console.log(`   - ${verifyResult.name}`);
    console.log(`     Min deposit: $${verifyResult.min_deposit_amount}`);
    console.log(`     Max bonus: $${verifyResult.max_bonus_amount}`);
    console.log(`     Bonus percent: ${verifyResult.bonus_percent}%`);
    console.log(`     Wagering multiplier: ${verifyResult.wagering_multiplier}`);

  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

// Run the update
updatePromotionValues(); 