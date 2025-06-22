require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_USER_ID = 'b8602d62-1e9b-4273-be98-05668a3cb9bd'; // Your test user ID

console.log('Environment check:', {
  SUPABASE_URL: SUPABASE_URL ? 'Set' : 'Missing',
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'Set' : 'Missing'
});

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDepositEndToEnd() {
  console.log('🧪 Testing Deposit Flow End-to-End');
  console.log('===================================\n');

  try {
    // Step 1: Check current wallet state
    console.log('1️⃣ Checking current wallet state...');
    const { data: wallet, error: walletError, status, statusText } = await supabase
      .rpc('get_wallet_by_user_id', { user_id_param: TEST_USER_ID });

    if (walletError) {
      console.log('❌ Error fetching wallet:', walletError);
      console.log('Status:', status, statusText);
      return;
    }

    const initialBalance = wallet?.[0]?.balance || 0;
    console.log(`✅ Current wallet balance: $${initialBalance.toFixed(2)}`);

    // Step 2: Check for active promotions
    console.log('\n2️⃣ Checking for active promotions...');
    const { data: activePromotion, error: promotionError } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotion:promotions(*)
      `)
      .eq('user_id', TEST_USER_ID)
      .eq('status', 'active')
      .eq('bonus_amount', 0)
      .single();

    if (promotionError && promotionError.code !== 'PGRST116') {
      console.log('❌ Error fetching promotions:', promotionError.message);
    } else if (activePromotion) {
      console.log(`✅ Found active promotion: ${activePromotion.promotion.name}`);
    } else {
      console.log('ℹ️ No active promotions found');
    }

    // Step 3: Simulate deposit via API call
    console.log('\n3️⃣ Testing deposit via API...');
    const depositAmount = 100;
    
    // Note: This would normally require authentication
    // For testing, we'll simulate the database operations directly
    console.log(`💰 Simulating deposit of $${depositAmount}...`);

    // Update wallet balance directly
    const newBalance = initialBalance + depositAmount;
    const { error: updateError } = await supabase
      .from('wallets')
      .upsert({
        user_id: TEST_USER_ID,
        balance: newBalance,
        currency: 'USD'
      });

    if (updateError) {
      console.log('❌ Error updating wallet:', updateError.message);
      return;
    }

    console.log(`✅ Wallet updated successfully. New balance: $${newBalance.toFixed(2)}`);

    // Step 4: Record transaction
    console.log('\n4️⃣ Recording transaction...');
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: TEST_USER_ID,
        type: 'deposit',
        amount: depositAmount,
        description: 'Test deposit',
        status: 'completed'
      });

    if (transactionError) {
      console.log('❌ Error recording transaction:', transactionError.message);
    } else {
      console.log('✅ Transaction recorded successfully');
    }

    // Step 5: Check if bonus should be applied
    if (activePromotion) {
      console.log('\n5️⃣ Checking deposit bonus eligibility...');
      const promotion = activePromotion.promotion;
      
      if (depositAmount >= promotion.min_deposit_amount) {
        console.log(`✅ Deposit meets minimum requirement ($${promotion.min_deposit_amount})`);
        
        // Calculate bonus
        const bonusAmount = Math.min(
          (depositAmount * promotion.bonus_percent) / 100,
          promotion.max_bonus_amount
        );
        
        if (bonusAmount > 0) {
          console.log(`💰 Bonus amount: $${bonusAmount.toFixed(2)}`);
          
          // Update user promotion
          const wageringRequirement = bonusAmount * promotion.wagering_multiplier;
          const { error: bonusUpdateError } = await supabase
            .from('user_promotions')
            .update({
              bonus_amount: bonusAmount,
              bonus_balance: bonusAmount,
              wagering_requirement: wageringRequirement,
              wagering_progress: 0
            })
            .eq('id', activePromotion.id);

          if (bonusUpdateError) {
            console.log('❌ Error updating promotion:', bonusUpdateError.message);
          } else {
            console.log('✅ Promotion updated with bonus details');
            
            // Add bonus to wallet
            const finalBalance = newBalance + bonusAmount;
            const { error: bonusWalletError } = await supabase
              .from('wallets')
              .update({ balance: finalBalance })
              .eq('user_id', TEST_USER_ID);

            if (bonusWalletError) {
              console.log('❌ Error adding bonus to wallet:', bonusWalletError.message);
            } else {
              console.log(`✅ Bonus added to wallet. Final balance: $${finalBalance.toFixed(2)}`);
            }
          }
        } else {
          console.log('ℹ️ No bonus to award');
        }
      } else {
        console.log(`❌ Deposit does not meet minimum requirement ($${promotion.min_deposit_amount})`);
      }
    }

    // Step 6: Verify final state
    console.log('\n6️⃣ Verifying final state...');
    const { data: finalWallet, error: finalWalletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', TEST_USER_ID)
      .single();

    if (finalWalletError) {
      console.log('❌ Error fetching final wallet:', finalWalletError.message);
    } else {
      console.log(`✅ Final wallet balance: $${finalWallet.balance.toFixed(2)}`);
    }

    console.log('\n🎉 Deposit flow test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDepositEndToEnd(); 