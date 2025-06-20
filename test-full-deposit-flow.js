const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFullDepositFlow() {
  console.log('🧪 Testing full deposit flow with bonus application...');
  
  const userId = 'b8602d62-1e9b-4273-be98-05668a3cb9bd';
  const depositAmount = 500;
  
  try {
    console.log('📊 Testing with user:', userId);
    console.log('💰 Deposit amount:', depositAmount);
    
    // Step 1: Get current wallet balance
    console.log('\n1️⃣ Getting current wallet...');
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      console.error('❌ Wallet fetch error:', walletError);
      return;
    }

    if (!wallet) {
      console.log('Creating new wallet for user:', userId);
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          currency: 'AUD',
          balance: 0,
          locked_balance: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Wallet creation error:', createError);
        return;
      }
      wallet = newWallet;
    }

    const currentBalance = Number(wallet.balance) || 0;
    console.log('💼 Current wallet balance:', currentBalance);

    // Step 2: Create deposit transaction
    console.log('\n2️⃣ Creating deposit transaction...');
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        type: 'test_deposit',
        amount: depositAmount,
        currency: 'AUD',
        status: 'completed',
        reference_id: `test_${Date.now()}`,
        metadata: {
          deposit_type: 'test',
          description: 'Test deposit for development'
        }
      });

    if (transactionError) {
      console.error('❌ Transaction creation error:', transactionError);
      return;
    }
    console.log('✅ Deposit transaction created');

    // Step 3: Update wallet balance
    console.log('\n3️⃣ Updating wallet balance...');
    const newBalance = currentBalance + depositAmount;
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Balance update error:', updateError);
      return;
    }
    console.log('✅ Wallet balance updated to:', updatedWallet.balance);

    // Step 4: Check for active deposit bonus
    console.log('\n4️⃣ Checking for active deposit bonus...');
    const { data: userPromotion, error: promoError } = await supabase
      .from('user_promotions')
      .select(`*, promotion:promotions(*)`)
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('bonus_awarded', 0)
      .single();

    console.log('📋 Bonus check result:', {
      promoError,
      hasUserPromotion: !!userPromotion,
      hasPromotion: !!userPromotion?.promotion,
      promotionType: userPromotion?.promotion?.type,
      bonusPercent: userPromotion?.promotion?.bonus_percent,
      maxBonusAmount: userPromotion?.promotion?.max_bonus_amount,
      minDepositAmount: userPromotion?.promotion?.min_deposit_amount,
      wageringMultiplier: userPromotion?.promotion?.wagering_multiplier
    });

    // Step 5: Apply bonus if conditions are met
    if (
      !promoError &&
      userPromotion &&
      userPromotion.promotion &&
      userPromotion.promotion.type === 'deposit' &&
      userPromotion.promotion.bonus_percent != null &&
      userPromotion.promotion.max_bonus_amount != null &&
      userPromotion.promotion.min_deposit_amount != null &&
      userPromotion.promotion.wagering_multiplier != null &&
      depositAmount >= userPromotion.promotion.min_deposit_amount
    ) {
      console.log('\n5️⃣ Applying deposit bonus...');
      
      const promotion = userPromotion.promotion;
      const bonus_awarded = Math.min(depositAmount * promotion.bonus_percent / 100, promotion.max_bonus_amount);
      const bonus_balance = bonus_awarded;
      const wagering_required = bonus_awarded * promotion.wagering_multiplier;
      const wagering_progress = 0;
      const updated_at = new Date().toISOString();

      console.log('💰 Bonus calculation:', {
        depositAmount: depositAmount,
        bonusPercent: promotion.bonus_percent,
        maxBonusAmount: promotion.max_bonus_amount,
        calculatedBonus: depositAmount * promotion.bonus_percent / 100,
        finalBonusAwarded: bonus_awarded,
        wageringRequired: wagering_required
      });

      // Update user_promotions row
      const { error: updateError } = await supabase
        .from('user_promotions')
        .update({
          bonus_awarded,
          bonus_balance,
          wagering_required,
          wagering_progress,
          updated_at
        })
        .eq('id', userPromotion.id);

      if (updateError) {
        console.error('❌ Error updating user_promotions:', updateError);
        return;
      }
      console.log('✅ User promotion updated with bonus');

      // Credit the user's wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: updatedWallet.balance + bonus_awarded,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (walletError) {
        console.error('❌ Error updating wallet:', walletError);
        return;
      }
      console.log('✅ Wallet credited with bonus');

      // Record bonus transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          wallet_id: wallet.id,
          type: 'bonus',
          amount: bonus_awarded,
          currency: 'AUD',
          status: 'completed',
          reference_id: `bonus-${Date.now()}`,
          metadata: {
            source: 'promotion',
            deposit_amount: depositAmount,
            promotion_id: promotion.id,
            user_promotion_id: userPromotion.id
          }
        });

      if (transactionError) {
        console.error('❌ Error creating bonus transaction:', transactionError);
        return;
      }
      console.log('✅ Bonus transaction recorded');

      // Step 6: Verify final state
      console.log('\n6️⃣ Verifying final state...');
      const { data: finalWallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: finalUserPromotion } = await supabase
        .from('user_promotions')
        .select('*')
        .eq('id', userPromotion.id)
        .single();

      console.log('🎉 DEPOSIT BONUS SUCCESSFULLY APPLIED!');
      console.log('📊 Final results:');
      console.log('  💼 Final wallet balance:', finalWallet.balance);
      console.log('  💰 Bonus awarded:', finalUserPromotion.bonus_awarded);
      console.log('  🎯 Wagering required:', finalUserPromotion.wagering_required);
      console.log('  📈 Total balance increase:', finalWallet.balance - currentBalance);
      
    } else {
      console.log('\n❌ Bonus conditions not met');
      console.log('Missing conditions:', {
        hasError: !!promoError,
        hasUserPromotion: !!userPromotion,
        hasPromotion: !!userPromotion?.promotion,
        isDepositType: userPromotion?.promotion?.type === 'deposit',
        hasBonusPercent: userPromotion?.promotion?.bonus_percent != null,
        hasMaxBonus: userPromotion?.promotion?.max_bonus_amount != null,
        hasMinDeposit: userPromotion?.promotion?.min_deposit_amount != null,
        hasWageringMultiplier: userPromotion?.promotion?.wagering_multiplier != null,
        meetsMinDeposit: depositAmount >= (userPromotion?.promotion?.min_deposit_amount || 0)
      });
    }
    
  } catch (error) {
    console.error('❌ Error in deposit flow:', error);
  }
}

testFullDepositFlow(); 