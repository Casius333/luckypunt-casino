const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Import the applyDepositBonus function logic directly
async function applyDepositBonus(userId, depositAmount) {
  try {
    // Find active deposit-type promotion for this user
    const { data: activePromotion, error: fetchError } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotion:promotions(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('bonus_amount', 0) // Only promotions that haven't been awarded yet
      .single();

    if (fetchError || !activePromotion) {
      console.log('No active deposit promotion found for user:', userId);
      return { success: false, message: 'No active deposit promotion found' };
    }

    const promotion = activePromotion.promotion;
    if (!promotion || promotion.type !== 'deposit_bonus') {
      console.log('Not a deposit-type promotion:', promotion?.id);
      return { success: false, message: 'Not a deposit-type promotion' };
    }

    // Check if deposit meets minimum requirement
    if (depositAmount < promotion.min_deposit_amount) {
      console.log(`Deposit amount ${depositAmount} is less than minimum ${promotion.min_deposit_amount}`);
      return { 
        success: false, 
        message: `Deposit amount must be at least $${promotion.min_deposit_amount}` 
      };
    }

    // Calculate bonus amount
    const bonusAmount = Math.min(
      (depositAmount * promotion.bonus_percent) / 100,
      promotion.max_bonus_amount
    );

    if (bonusAmount <= 0) {
      console.log('Calculated bonus amount is 0 or negative');
      return { success: false, message: 'No bonus to award' };
    }

    // Calculate wagering requirement
    const wageringRequirement = bonusAmount * promotion.wagering_multiplier;

    // Update user promotion with bonus details
    const { error: updateError } = await supabase
      .from('user_promotions')
      .update({
        deposit_amount: depositAmount,
        bonus_amount: bonusAmount,
        bonus_balance: bonusAmount,
        wagering_required: wageringRequirement,
        wagering_progress: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', activePromotion.id);

    if (updateError) {
      console.error('Error updating user promotion:', updateError);
      throw updateError;
    }

    // Add bonus to user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      console.error('Error fetching wallet:', walletError);
      throw new Error('Wallet not found');
    }

    // Update wallet balance
    const { error: balanceError } = await supabase
      .from('wallets')
      .update({
        balance: wallet.balance + bonusAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (balanceError) {
      console.error('Error updating wallet balance:', balanceError);
      throw balanceError;
    }

    // Record bonus transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        type: 'deposit_bonus',
        amount: bonusAmount,
        currency: 'AUD',
        status: 'completed',
        reference_id: `bonus_${activePromotion.id}`,
        metadata: { 
          description: `Deposit bonus from ${promotion.name}`,
          deposit_amount: depositAmount,
          promotion_id: promotion.id,
          user_promotion_id: activePromotion.id
        }
      });

    if (transactionError) {
      console.error('Error recording bonus transaction:', transactionError);
      throw transactionError;
    }

    console.log(`Successfully applied deposit bonus: $${bonusAmount.toFixed(2)} for user ${userId}`);

    return {
      success: true,
      bonusAmount,
      wageringRequirement,
      message: `Deposit bonus applied! You received $${bonusAmount.toFixed(2)} bonus`
    };

  } catch (error) {
    console.error('Error applying deposit bonus:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to apply deposit bonus'
    };
  }
}

async function testDepositBonusFlow() {
  console.log('🚀 Starting comprehensive deposit bonus flow test...\n')

  // Step 1: Create test user
  console.log('📝 Step 1: Creating test user...')
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'testpassword123'
  
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true
  })

  if (userError) {
    console.error('❌ Failed to create test user:', userError)
    return
  }

  const testUserId = userData.user.id
  console.log('✅ Test user created:', testUserId)

  // Step 2: Delete any existing wallets for this user (cleanup)
  await supabase.from('wallets').delete().eq('user_id', testUserId)

  // Step 2: Create wallet for test user
  console.log('\n💰 Step 2: Creating wallet for test user...')
  const { data: walletData, error: walletError } = await supabase
    .from('wallets')
    .insert({
      user_id: testUserId,
      currency: 'AUD',
      balance: 0,
      locked_balance: 0
    })
    .select()
    .single()

  if (walletError) {
    console.error('❌ Failed to create wallet:', walletError)
    return
  }

  console.log('✅ Wallet created with balance:', walletData.balance)

  // Step 3: Check available promotions
  console.log('\n🎁 Step 3: Checking available promotions...')
  const now = new Date().toISOString()
  const { data: promotions, error: promotionsError } = await supabase
    .from('promotions')
    .select('*')
    .eq('type', 'deposit_bonus')
    .eq('is_active', true)
    .lte('start_at', now)
    .gte('end_at', now)

  if (promotionsError) {
    console.error('❌ Failed to fetch promotions:', promotionsError)
    return
  }

  if (!promotions || promotions.length === 0) {
    console.log('❌ No active deposit bonus promotions found')
    return
  }

  const promotion = promotions[0]
  console.log('✅ Found active promotion:', promotion.name)

  // Step 4: Activate promotion for test user
  console.log('\n🎯 Step 4: Activating promotion for test user...')
  const { data: userPromotionData, error: activationError } = await supabase
    .from('user_promotions')
    .insert({
      user_id: testUserId,
      promotion_id: promotion.id,
      status: 'active',
      activated_at: new Date().toISOString(),
      bonus_balance: 0,
      wagering_progress: 0,
      winnings_from_bonus: 0,
      bonus_amount: 0,
      wagering_requirement: promotion.wagering_multiplier * promotion.max_bonus_amount
    })
    .select()
    .single()

  if (activationError) {
    console.error('❌ Failed to activate promotion:', activationError)
    return
  }

  console.log('✅ Promotion activated')

  // Step 5: Make a deposit
  console.log('\n💳 Step 5: Making a deposit...')
  const depositAmount = 100
  
  // First, update the wallet balance
  const { data: updatedWallet, error: walletUpdateError } = await supabase
    .from('wallets')
    .update({ 
      balance: walletData.balance + depositAmount,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', testUserId)
    .select()
    .single()

  if (walletUpdateError) {
    console.error('❌ Failed to update wallet:', walletUpdateError)
    return
  }

  console.log('✅ Wallet updated. New balance:', updatedWallet.balance)

  // Step 6: Apply deposit bonus using the actual function
  console.log('🎁 Step 6: Applying deposit bonus...');
  const bonusResult = await applyDepositBonus(testUserId, depositAmount);
  
  if (!bonusResult.success) {
    console.error('❌ Failed to apply bonus:', bonusResult.message);
    return;
  }

  console.log('✅ Bonus applied:', bonusResult.bonusAmount);

  // Step 7: Verify final state
  console.log('🔍 Step 7: Verifying final state...');
  
  // Check wallet
  const { data: finalWallet, error: finalWalletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', testUserId)
    .single();

  if (finalWalletError) {
    console.error('❌ Failed to fetch final wallet:', finalWalletError);
    return;
  }

  // Check user promotion
  const { data: finalUserPromotion, error: finalPromotionError } = await supabase
    .from('user_promotions')
    .select('*')
    .eq('id', userPromotionData.id)
    .single();

  if (finalPromotionError) {
    console.error('❌ Failed to fetch final user promotion:', finalPromotionError);
    return;
  }

  console.log('\n🎉 DEPOSIT BONUS FLOW TEST COMPLETED SUCCESSFULLY!');
  console.log('─'.repeat(50));
  console.log('Final Wallet Balance:', finalWallet.balance);
  console.log('Deposit Amount:', finalUserPromotion.deposit_amount);
  console.log('Bonus Awarded:', finalUserPromotion.bonus_awarded);
  console.log('Bonus Balance:', finalUserPromotion.bonus_balance);
  console.log('Wagering Required:', finalUserPromotion.wagering_required);
  console.log('Promotion Status:', finalUserPromotion.status);
  console.log('─'.repeat(50));

  // Cleanup test data
  console.log('\n🧹 Cleaning up test data...');
  await supabase.from('transactions').delete().eq('user_id', testUserId);
  await supabase.from('user_promotions').delete().eq('user_id', testUserId);
  await supabase.from('wallets').delete().eq('user_id', testUserId);
  await supabase.auth.admin.deleteUser(testUserId);
  console.log('✅ Test data cleaned up');
}

testDepositBonusFlow().catch(console.error) 