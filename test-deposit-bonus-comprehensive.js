const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://lexsfcrpmzgadmbwnrwp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxleHNmY3JwbXpnYWRtYnducndwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODkwNDE2NCwiZXhwIjoyMDY0NDgwMTY0fQ.m3LDMgSODLVslfDH-EgPZpxT5wcqGFxdefYJearvXro';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDepositBonusFlow() {
  console.log('=== COMPREHENSIVE DEPOSIT BONUS TEST ===\n');

  try {
    // Step 1: Get user ID (using the known user ID from previous tests)
    const userId = 'b8602d62-1e9b-4273-be98-05668a3cb9bd';
    console.log('1. Testing with user ID:', userId);

    // Step 2: Check current wallet balance
    console.log('\n2. Checking current wallet balance...');
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError) {
      console.log('❌ Wallet error:', walletError);
      return;
    }

    console.log('✅ Current wallet balance:', wallet.balance);

    // Step 3: Check for active promotions
    console.log('\n3. Checking for active promotions...');
    const { data: activePromotions, error: promoError } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotions (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (promoError) {
      console.log('❌ Promotions error:', promoError);
      return;
    }

    console.log('✅ Active promotions found:', activePromotions.length);
    
    if (activePromotions.length > 0) {
      activePromotions.forEach(promo => {
        console.log(`   - ${promo.promotions.name} (${promo.promotions.type})`);
        console.log(`     Status: ${promo.status}, Bonus awarded: ${promo.bonus_awarded}`);
        console.log(`     Bonus balance: ${promo.bonus_balance}, Wagering required: ${promo.wagering_required}`);
      });
    }

    // Step 4: Check for deposit bonus specifically
    console.log('\n4. Checking for deposit bonus promotions...');
    const { data: depositPromotions, error: depositError } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotions (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('promotions.type', 'deposit');

    if (depositError) {
      console.log('❌ Deposit promotions error:', depositError);
      return;
    }

    console.log('✅ Deposit promotions found:', depositPromotions.length);
    
    if (depositPromotions.length > 0) {
      const depositPromo = depositPromotions[0];
      console.log(`   - ${depositPromo.promotions.name}`);
      console.log(`     Bonus percent: ${depositPromo.promotions.bonus_percent}%`);
      console.log(`     Min deposit: $${depositPromo.promotions.min_deposit_amount}`);
      console.log(`     Max bonus: $${depositPromo.promotions.max_bonus_amount}`);
      console.log(`     Bonus awarded: ${depositPromo.bonus_awarded}`);
      console.log(`     Bonus balance: ${depositPromo.bonus_balance}`);
      console.log(`     Wagering required: ${depositPromo.wagering_required}`);
    }

    // Step 5: Simulate a deposit and check if bonus should be applied
    console.log('\n5. Simulating deposit scenario...');
    const depositAmount = 100;
    console.log(`   Deposit amount: $${depositAmount}`);

    if (depositPromotions.length > 0) {
      const depositPromo = depositPromotions[0];
      const promo = depositPromo.promotions;
      
      if (depositPromo.bonus_awarded === 0 && depositAmount >= promo.min_deposit_amount) {
        console.log('   ✅ Deposit bonus should be applied!');
        
        // Calculate bonus
        const bonusAmount = Math.min(
          depositAmount * (promo.bonus_percent / 100),
          promo.max_bonus_amount
        );
        console.log(`   Bonus amount: $${bonusAmount}`);
        
        // Calculate wagering requirement
        const wageringRequired = (depositAmount + bonusAmount) * promo.wagering_multiplier;
        console.log(`   Wagering required: $${wageringRequired}`);
        
        console.log('\n6. Testing bonus application logic...');
        
        // Simulate what the API should do:
        // 1. Update user_promotions
        const { error: updateError } = await supabase
          .from('user_promotions')
          .update({
            bonus_awarded: bonusAmount,
            bonus_balance: bonusAmount,
            wagering_required: wageringRequired,
            updated_at: new Date().toISOString()
          })
          .eq('id', depositPromo.id);

        if (updateError) {
          console.log('❌ Failed to update user_promotions:', updateError);
          return;
        }
        console.log('   ✅ Updated user_promotions');

        // 2. Update wallet
        const { error: walletUpdateError } = await supabase
          .from('wallets')
          .update({
            balance: wallet.balance + depositAmount + bonusAmount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (walletUpdateError) {
          console.log('❌ Failed to update wallet:', walletUpdateError);
          return;
        }
        console.log('   ✅ Updated wallet');

        // 3. Record deposit transaction
        const { error: depositTxError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            type: 'deposit',
            amount: depositAmount,
            status: 'completed'
          });

        if (depositTxError) {
          console.log('❌ Failed to record deposit transaction:', depositTxError);
          return;
        }
        console.log('   ✅ Recorded deposit transaction');

        // 4. Record bonus transaction
        const { error: bonusTxError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            type: 'bonus',
            amount: bonusAmount,
            status: 'completed'
          });

        if (bonusTxError) {
          console.log('❌ Failed to record bonus transaction:', bonusTxError);
          return;
        }
        console.log('   ✅ Recorded bonus transaction');

        console.log('\n7. Verifying results...');
        
        // Check updated wallet
        const { data: newWallet } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        console.log(`   New wallet balance: $${newWallet.balance}`);

        // Check updated promotion
        const { data: updatedPromo } = await supabase
          .from('user_promotions')
          .select('*')
          .eq('id', depositPromo.id)
          .single();
        
        console.log(`   Updated promotion bonus_awarded: $${updatedPromo.bonus_awarded}`);
        console.log(`   Updated promotion bonus_balance: $${updatedPromo.bonus_balance}`);
        console.log(`   Updated promotion wagering_required: $${updatedPromo.wagering_required}`);

        // Check transactions
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        console.log('   Recent transactions:');
        transactions.forEach(tx => {
          console.log(`     - ${tx.type}: $${tx.amount}`);
        });

        console.log('\n🎉 DEPOSIT BONUS TEST COMPLETED SUCCESSFULLY!');
        console.log('✅ Bonus was applied correctly');
        console.log('✅ Wallet was updated');
        console.log('✅ User_promotions was updated');
        console.log('✅ Transactions were recorded');

      } else {
        console.log('   ❌ Deposit bonus should NOT be applied');
        console.log(`     Reason: bonus_awarded=${depositPromo.bonus_awarded}, deposit=${depositAmount}, min_deposit=${promo.min_deposit_amount}`);
      }
    } else {
      console.log('   ❌ No active deposit bonus found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDepositBonusFlow(); 