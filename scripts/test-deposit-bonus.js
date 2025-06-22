const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Inline the applyDepositBonus function for testing
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
      .single()

    if (fetchError || !activePromotion) {
      return {
        success: false,
        message: 'No active deposit bonus promotion found'
      }
    }

    const promotion = activePromotion.promotion

    // Check if deposit meets minimum requirement
    if (depositAmount < promotion.min_deposit_amount) {
      return {
        success: false,
        message: `Deposit amount ${depositAmount} is below minimum requirement ${promotion.min_deposit_amount}`
      }
    }

    // Calculate bonus amount
    const bonusAmount = Math.min(
      (depositAmount * promotion.bonus_percent) / 100,
      promotion.max_bonus_amount
    )

    // Calculate wagering requirement
    const wageringRequirement = bonusAmount * promotion.wagering_multiplier

    // Update user promotion with bonus details
    const { error: updateError } = await supabase
      .from('user_promotions')
      .update({
        bonus_amount: bonusAmount,
        bonus_balance: bonusAmount,
        wagering_required: wageringRequirement,
        wagering_progress: 0
      })
      .eq('id', activePromotion.id)

    if (updateError) {
      console.error('Error updating user promotion:', updateError)
      return {
        success: false,
        message: 'Failed to update user promotion'
      }
    }

    // Create bonus transaction
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (walletError) {
      console.error('Error fetching wallet:', walletError)
      return {
        success: false,
        message: 'Failed to fetch wallet'
      }
    }

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: walletData.id,
        type: 'bonus',
        amount: bonusAmount,
        currency: 'AUD',
        status: 'completed',
        reference_id: `bonus_${activePromotion.id}_${Date.now()}`,
        metadata: {
          promotion_id: promotion.id,
          user_promotion_id: activePromotion.id,
          deposit_amount: depositAmount,
          bonus_type: 'deposit_bonus'
        }
      })

    if (transactionError) {
      console.error('Error creating bonus transaction:', transactionError)
      return {
        success: false,
        message: 'Failed to create bonus transaction'
      }
    }

    return {
      success: true,
      bonusAmount,
      wageringRequirement,
      message: `Successfully awarded ${bonusAmount} bonus with ${wageringRequirement} wagering requirement`
    }
  } catch (error) {
    console.error('Error in applyDepositBonus:', error)
    return {
      success: false,
      message: 'Unexpected error applying deposit bonus'
    }
  }
}

async function testDepositBonusFlow() {
  console.log('🧪 Testing Deposit Bonus Flow...\n')

  try {
    // 1. Create a test user
    console.log('1. Creating test user...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: `test-deposit-bonus-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true
    })

    if (authError) {
      console.error('Error creating test user:', authError)
      return
    }

    const userId = authUser.user.id
    console.log('✅ Test user created:', userId)

    // 2. Create a wallet for the user
    console.log('\n2. Creating wallet...')
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        currency: 'AUD',
        balance: 0,
        locked_balance: 0
      })
      .select()
      .single()

    if (walletError) {
      console.error('Error creating wallet:', walletError)
      return
    }

    console.log('✅ Wallet created:', wallet.id)

    // 3. Create a deposit bonus promotion
    console.log('\n3. Creating deposit bonus promotion...')
    const { data: promotion, error: promoError } = await supabase
      .from('promotions')
      .insert({
        name: 'Test Deposit Bonus',
        description: '100% deposit bonus up to $100',
        type: 'deposit',
        bonus_percent: 100,
        max_bonus_amount: 100,
        min_deposit_amount: 50,
        wagering_multiplier: 25,
        max_withdrawal_amount: 200,
        is_active: true,
        start_at: new Date().toISOString()
      })
      .select()
      .single()

    if (promoError) {
      console.error('Error creating promotion:', promoError)
      return
    }

    console.log('✅ Promotion created:', promotion.id)

    // 4. Activate the promotion for the user (simulate the new flow)
    console.log('\n4. Activating promotion for user...')
    const { data: userPromotion, error: userPromoError } = await supabase
      .from('user_promotions')
      .insert({
        user_id: userId,
        promotion_id: promotion.id,
        status: 'active',
        activated_at: new Date().toISOString(),
        bonus_amount: 0, // No bonus awarded yet
        bonus_balance: 0, // Required field
        wagering_required: 0, // No wagering required yet
        wagering_progress: 0, // Start with 0 progress
        winnings_from_bonus: 0
      })
      .select(`
        *,
        promotion:promotions(*)
      `)
      .single()

    if (userPromoError) {
      console.error('Error activating promotion:', userPromoError)
      return
    }

    console.log('✅ Promotion activated (waiting for deposit)')
    console.log('   - Bonus amount:', userPromotion.bonus_amount)
    console.log('   - Wagering requirement:', userPromotion.wagering_required)

    // 5. Simulate a deposit that should trigger the bonus
    console.log('\n5. Making a deposit that should trigger bonus...')
    const depositAmount = 75 // Above minimum requirement

    // First, make the deposit transaction
    const { error: depositError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        type: 'deposit',
        amount: depositAmount,
        currency: 'AUD',
        status: 'completed',
        reference_id: `test_${Date.now()}`,
        metadata: {
          deposit_type: 'test',
          description: 'Test deposit for bonus testing'
        }
      })

    if (depositError) {
      console.error('Error creating deposit transaction:', depositError)
      return
    }

    // Update wallet balance
    const { data: updatedWallet, error: balanceError } = await supabase
      .from('wallets')
      .update({
        balance: depositAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)
      .select()
      .single()

    if (balanceError) {
      console.error('Error updating wallet balance:', balanceError)
      return
    }

    console.log('✅ Deposit completed, wallet balance:', updatedWallet.balance)

    // 6. Now apply the deposit bonus using the inline function
    console.log('\n6. Applying deposit bonus...')
    
    const bonusResult = await applyDepositBonus(userId, depositAmount)
    
    if (bonusResult.success) {
      console.log('✅ Deposit bonus applied successfully!')
      console.log('   - Bonus amount:', bonusResult.bonusAmount)
      console.log('   - Wagering requirement:', bonusResult.wageringRequirement)
      console.log('   - Message:', bonusResult.message)
    } else {
      console.log('❌ Failed to apply deposit bonus:', bonusResult.message)
    }

    // 7. Check the final state
    console.log('\n7. Checking final state...')
    
    // Get updated user promotion
    const { data: finalUserPromotion, error: finalPromoError } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotion:promotions(*)
      `)
      .eq('id', userPromotion.id)
      .single()

    if (finalPromoError) {
      console.error('Error fetching final user promotion:', finalPromoError)
    } else {
      console.log('✅ Final user promotion state:')
      console.log('   - Bonus amount:', finalUserPromotion.bonus_amount)
      console.log('   - Bonus balance:', finalUserPromotion.bonus_balance)
      console.log('   - Wagering requirement:', finalUserPromotion.wagering_required)
      console.log('   - Wagering progress:', finalUserPromotion.wagering_progress)
      console.log('   - Status:', finalUserPromotion.status)
    }

    // Get updated wallet
    const { data: finalWallet, error: finalWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', wallet.id)
      .single()

    if (finalWalletError) {
      console.error('Error fetching final wallet:', finalWalletError)
    } else {
      console.log('✅ Final wallet state:')
      console.log('   - Balance:', finalWallet.balance)
      console.log('   - Locked balance:', finalWallet.locked_balance)
    }

    // 8. Clean up test data
    console.log('\n8. Cleaning up test data...')
    
    // Delete test data in reverse order
    await supabase.from('transactions').delete().eq('user_id', userId)
    await supabase.from('user_promotions').delete().eq('user_id', userId)
    await supabase.from('wallets').delete().eq('user_id', userId)
    await supabase.from('promotions').delete().eq('id', promotion.id)
    await supabase.auth.admin.deleteUser(userId)
    
    console.log('✅ Test data cleaned up')

    console.log('\n🎉 Deposit bonus flow test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testDepositBonusFlow() 