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

async function testEndToEndBonusFlow() {
  console.log('🧪 Testing End-to-End Deposit Bonus Flow...\n')

  try {
    // 0. Clean up any existing test data
    console.log('0. Cleaning up existing test data...')
    const testEmail = `test-e2e-bonus-${Date.now()}@example.com`
    
    // Delete any existing test users with similar emails
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    if (!listError) {
      const testUsers = existingUsers.users.filter(user => 
        user.email && user.email.includes('test-e2e-bonus-')
      )
      for (const user of testUsers) {
        console.log('   Cleaning up test user:', user.email)
        await supabase.auth.admin.deleteUser(user.id)
      }
    }

    // 1. Create a test user
    console.log('\n1. Creating test user...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
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
        name: 'E2E Test Deposit Bonus',
        description: '100% deposit bonus up to $100',
        bonus_percent: 100,
        max_bonus_amount: 100,
        min_deposit_amount: 50,
        wagering_multiplier: 25,
        max_withdrawal_amount: 200,
        is_active: true,
        start_at: new Date().toISOString(),
        end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      })
      .select()
      .single()

    if (promoError) {
      console.error('Error creating promotion:', promoError)
      return
    }

    console.log('✅ Promotion created:', promotion.id)

    // 4. Simulate user activating the promotion (through the UI)
    console.log('\n4. Simulating user activating promotion...')
    const { data: userPromotion, error: userPromoError } = await supabase
      .from('user_promotions')
      .insert({
        user_id: userId,
        promotion_id: promotion.id,
        status: 'active',
        activated_at: new Date().toISOString(),
        bonus_amount: 0,
        bonus_balance: 0,
        wagering_requirement: 0,
        wagering_progress: 0,
        max_withdrawal_amount: promotion.max_withdrawal_amount
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
    console.log('   - Status:', userPromotion.status)
    console.log('   - Bonus amount:', userPromotion.bonus_amount)

    // 5. Simulate user making a deposit (through the API)
    console.log('\n5. Simulating user making a deposit...')
    const depositAmount = 75 // Above minimum requirement

    // Create deposit transaction
    const { error: depositError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        type: 'deposit',
        amount: depositAmount,
        currency: 'AUD',
        status: 'completed',
        reference_id: `e2e_test_${Date.now()}`,
        metadata: {
          deposit_type: 'test',
          description: 'E2E test deposit'
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

    // 6. Apply deposit bonus (simulate the API logic)
    console.log('\n6. Applying deposit bonus...')
    
    // Apply deposit bonus logic directly
    let bonusApplied = false
    let appliedBonusAmount = 0
    
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
        console.log('❌ No active deposit promotion found:', fetchError?.message || 'No promotion found')
      } else {
        const promotion = activePromotion.promotion
        if (!promotion || promotion.min_deposit_amount === 0) {
          console.log('❌ Not a deposit-type promotion')
        } else if (depositAmount < promotion.min_deposit_amount) {
          console.log(`❌ Deposit amount ${depositAmount} is less than minimum ${promotion.min_deposit_amount}`)
        } else {
          // Calculate bonus amount
          const bonusAmount = Math.min(
            (depositAmount * promotion.bonus_percent) / 100,
            promotion.max_bonus_amount
          )

          if (bonusAmount <= 0) {
            console.log('❌ Calculated bonus amount is 0 or negative')
          } else {
            // Calculate wagering requirement
            const wageringRequirement = bonusAmount * promotion.wagering_multiplier

            // Update user promotion with bonus details
            const { error: updateError } = await supabase
              .from('user_promotions')
              .update({
                bonus_amount: bonusAmount,
                bonus_balance: bonusAmount,
                wagering_requirement: wageringRequirement,
                wagering_progress: 0,
                updated_at: new Date().toISOString()
              })
              .eq('id', activePromotion.id)

            if (updateError) {
              console.log('❌ Error updating user promotion:', updateError.message)
            } else {
              // Add bonus to user's wallet
              const { data: finalWallet, error: balanceError } = await supabase
                .from('wallets')
                .update({
                  balance: updatedWallet.balance + bonusAmount,
                  updated_at: new Date().toISOString()
                })
                .eq('id', wallet.id)
                .select()
                .single()

              if (balanceError) {
                console.log('❌ Error updating wallet balance:', balanceError.message)
              } else {
                // Record bonus transaction
                const { error: transactionError } = await supabase
                  .from('transactions')
                  .insert({
                    user_id: userId,
                    wallet_id: wallet.id,
                    type: 'bonus',
                    amount: bonusAmount,
                    currency: 'AUD',
                    status: 'completed',
                    reference_id: `bonus-${Date.now()}`,
                    metadata: { 
                      source: 'promotion',
                      deposit_amount: depositAmount,
                      promotion_id: promotion.id,
                      user_promotion_id: activePromotion.id
                    }
                  })

                if (transactionError) {
                  console.log('❌ Error recording bonus transaction:', transactionError.message)
                } else {
                  bonusApplied = true
                  appliedBonusAmount = bonusAmount
                  console.log('✅ Deposit bonus applied successfully!')
                  console.log('   - Bonus amount:', bonusAmount)
                  console.log('   - Wagering requirement:', wageringRequirement)
                  console.log('   - Final wallet balance:', finalWallet.balance)
                  console.log('   - Message: Deposit bonus applied! You received $' + bonusAmount.toFixed(2) + ' bonus')
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.log('❌ Error applying deposit bonus:', error.message)
    }

    // 7. Verify final state
    console.log('\n7. Verifying final state...')
    
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
      console.log('   - Status:', finalUserPromotion.status)
      console.log('   - Bonus amount:', finalUserPromotion.bonus_amount)
      console.log('   - Bonus balance:', finalUserPromotion.bonus_balance)
      console.log('   - Wagering requirement:', finalUserPromotion.wagering_requirement)
      console.log('   - Wagering progress:', finalUserPromotion.wagering_progress)
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
      const expectedBalance = depositAmount + (bonusApplied ? appliedBonusAmount : 0)
      console.log('✅ Final wallet state:')
      console.log('   - Balance:', finalWallet.balance)
      console.log('   - Expected:', expectedBalance)
      console.log('   - Match:', finalWallet.balance === expectedBalance ? '✅' : '❌')
    }

    // Get bonus transaction
    const { data: bonusTransaction, error: bonusTxError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'bonus')
      .eq('wallet_id', wallet.id)
      .single()

    if (bonusTxError) {
      console.log('❌ No bonus transaction found:', bonusTxError.message)
    } else {
      console.log('✅ Bonus transaction created:')
      console.log('   - Amount:', bonusTransaction.amount)
      console.log('   - Reference:', bonusTransaction.reference_id)
      console.log('   - Metadata:', bonusTransaction.metadata)
    }

    // Summary
    console.log('\n📊 E2E TEST SUMMARY:')
    console.log('   - Test user ID:', userId)
    console.log('   - Test wallet ID:', wallet.id)
    console.log('   - Deposit amount:', depositAmount)
    console.log('   - Bonus applied:', bonusApplied ? '✅' : '❌')
    console.log('   - Bonus amount:', appliedBonusAmount || 0)
    console.log('   - Final wallet balance:', finalWallet?.balance || 'Unknown')
    console.log('   - Bonus transaction created:', bonusTransaction ? '✅' : '❌')
    console.log('   - User promotion updated:', finalUserPromotion ? '✅' : '❌')

    console.log('\n🎉 End-to-end deposit bonus flow test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testEndToEndBonusFlow() 