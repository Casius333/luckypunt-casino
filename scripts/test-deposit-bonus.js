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
        bonus_amount: 0, // No bonus awarded yet
        wagering_requirement: 0,
        max_withdrawal_amount: promotion.max_withdrawal_amount,
        status: 'active'
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
    console.log('   - Wagering requirement:', userPromotion.wagering_requirement)

    // 5. Simulate a deposit that should trigger the bonus
    console.log('\n5. Making a deposit that should trigger bonus...')
    const depositAmount = 75 // Above minimum requirement

    // First, make the deposit transaction
    const { error: depositError } = await supabase
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

    // 6. Now apply the deposit bonus (simulate the API call)
    console.log('\n6. Applying deposit bonus...')
    const { applyDepositBonus } = require('../src/lib/promotionUtils')
    
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
      console.log('   - Wagering requirement:', finalUserPromotion.wagering_requirement)
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
      console.log('   - Expected:', depositAmount + (bonusResult.success ? bonusResult.bonusAmount : 0))
    }

    // Get bonus transaction
    const { data: bonusTransaction, error: bonusTxError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'bonus')
      .single()

    if (bonusTxError) {
      console.log('❌ No bonus transaction found:', bonusTxError.message)
    } else {
      console.log('✅ Bonus transaction created:')
      console.log('   - Amount:', bonusTransaction.amount)
      console.log('   - Reference:', bonusTransaction.reference_id)
      console.log('   - Metadata:', bonusTransaction.metadata)
    }

    console.log('\n🎉 Deposit bonus flow test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testDepositBonusFlow() 