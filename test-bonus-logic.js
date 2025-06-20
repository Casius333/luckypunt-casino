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

async function testBonusLogic() {
  console.log('🧪 Testing bonus logic directly...');
  
  const userId = 'b8602d62-1e9b-4273-be98-05668a3cb9bd';
  const depositAmount = 500;
  
  try {
    console.log('📊 Testing with user:', userId);
    console.log('💰 Deposit amount:', depositAmount);
    
    // Simulate the exact bonus logic from the deposit route
    console.log('🔍 Querying user_promotions...');
    const { data: userPromotion, error: promoError } = await supabase
      .from('user_promotions')
      .select(`*, promotion:promotions(*)`)
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('bonus_awarded', 0)
      .single();

    console.log('📋 Query result:', {
      promoError,
      userPromotion,
      promotion: userPromotion?.promotion,
      hasPromotion: !!userPromotion?.promotion,
      promotionType: userPromotion?.promotion?.type,
      bonusPercent: userPromotion?.promotion?.bonus_percent,
      maxBonusAmount: userPromotion?.promotion?.max_bonus_amount,
      minDepositAmount: userPromotion?.promotion?.min_deposit_amount,
      wageringMultiplier: userPromotion?.promotion?.wagering_multiplier,
      depositAmount: depositAmount
    });

    // Check conditions
    const conditions = {
      hasError: !!promoError,
      hasUserPromotion: !!userPromotion,
      hasPromotion: !!userPromotion?.promotion,
      isDepositType: userPromotion?.promotion?.type === 'deposit',
      hasBonusPercent: userPromotion?.promotion?.bonus_percent != null,
      hasMaxBonus: userPromotion?.promotion?.max_bonus_amount != null,
      hasMinDeposit: userPromotion?.promotion?.min_deposit_amount != null,
      hasWageringMultiplier: userPromotion?.promotion?.wagering_multiplier != null,
      meetsMinDeposit: depositAmount >= (userPromotion?.promotion?.min_deposit_amount || 0)
    };

    console.log('✅ Conditions check:', conditions);

    // Check if all conditions are met
    const allConditionsMet = (
      !promoError &&
      userPromotion &&
      userPromotion.promotion &&
      userPromotion.promotion.type === 'deposit' &&
      userPromotion.promotion.bonus_percent != null &&
      userPromotion.promotion.max_bonus_amount != null &&
      userPromotion.promotion.min_deposit_amount != null &&
      userPromotion.promotion.wagering_multiplier != null &&
      depositAmount >= userPromotion.promotion.min_deposit_amount
    );

    console.log('🎯 All conditions met:', allConditionsMet);

    if (allConditionsMet) {
      console.log('🎉 Bonus would be applied!');
      
      const promotion = userPromotion.promotion;
      const bonus_awarded = Math.min(depositAmount * promotion.bonus_percent / 100, promotion.max_bonus_amount);
      const bonus_balance = bonus_awarded;
      const wagering_required = bonus_awarded * promotion.wagering_multiplier;
      
      console.log('💰 Bonus calculation:', {
        depositAmount: depositAmount,
        bonusPercent: promotion.bonus_percent,
        maxBonusAmount: promotion.max_bonus_amount,
        calculatedBonus: depositAmount * promotion.bonus_percent / 100,
        finalBonusAwarded: bonus_awarded,
        wageringRequired: wagering_required
      });
      
      console.log('✅ Bonus logic is working correctly!');
    } else {
      console.log('❌ Bonus conditions not met');
      console.log('Missing conditions:', Object.entries(conditions).filter(([key, value]) => !value).map(([key]) => key));
    }
    
  } catch (error) {
    console.error('❌ Error testing bonus logic:', error);
  }
}

testBonusLogic(); 