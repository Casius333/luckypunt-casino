const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Use a known test user ID (replace with your actual test user ID)
const testUserId = 'b8602d62-1e9b-4273-be98-05668a3cb9bd'

async function testDepositBonusFlow() {
  console.log('=== STARTING DEPOSIT BONUS FLOW TEST ===')
  
  try {
    console.log(`\nUsing test user: ${testUserId}`)
    
    // Step 2: Check user's wallet
    console.log('\n2. Checking user wallet...')
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance, user_id')
      .eq('user_id', testUserId)
      .single()
    if (walletError) {
      console.error('❌ Error fetching wallet:', walletError)
      return
    }
    
    console.log(`✅ Wallet found: Balance = $${wallet.balance}`)
    
    // Step 3: Check for active promotions
    console.log('\n3. Checking for active promotions...')
    const { data: activePromotion, error: promotionError } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotions (*)
      `)
      .eq('user_id', testUserId)
      .eq('status', 'active')
      .single()
    
    if (promotionError && promotionError.code !== 'PGRST116') {
      console.error('❌ Error fetching active promotion:', promotionError)
      return
    }
    
    if (activePromotion) {
      console.log(`✅ Active promotion found: ${activePromotion.promotions.name}`)
      console.log(`   Bonus awarded: $${activePromotion.bonus_awarded}`)
      console.log(`   Bonus balance: $${activePromotion.bonus_balance}`)
      console.log(`   Wagering required: $${activePromotion.wagering_required}`)
      console.log(`   Wagering completed: $${activePromotion.wagering_completed}`)
    } else {
      console.log('ℹ️  No active promotion found')
      
      // Step 4: Check available promotions to activate
      console.log('\n4. Checking available promotions...')
      const { data: availablePromotions, error: availableError } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .eq('type', 'deposit_bonus')
      
      if (availableError) {
        console.error('❌ Error fetching available promotions:', availableError)
        return
      }
      
      console.log(`✅ Found ${availablePromotions.length} available deposit bonus promotions`)
      
      if (availablePromotions.length > 0) {
        const promotion = availablePromotions[0]
        console.log(`\n5. Activating promotion: ${promotion.name}`)
        
        // Activate the promotion
        const { data: activatedPromotion, error: activateError } = await supabase
          .from('user_promotions')
          .insert({
            user_id: testUserId,
            promotion_id: promotion.id,
            status: 'active',
            bonus_awarded: 0,
            bonus_balance: 0,
            wagering_required: 0,
            wagering_completed: 0,
            activated_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (activateError) {
          console.error('❌ Error activating promotion:', activateError)
          return
        }
        
        console.log(`✅ Promotion activated successfully!`)
        console.log(`   User promotion ID: ${activatedPromotion.id}`)
      }
    }
    
    // Step 5: Simulate a deposit
    console.log('\n6. Simulating deposit...')
    const depositAmount = 100
    
    // Update wallet balance
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .update({ balance: wallet.balance + depositAmount })
      .eq('user_id', testUserId)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Error updating wallet:', updateError)
      return
    }
    
    console.log(`✅ Deposit processed: $${depositAmount}`)
    console.log(`   New balance: $${updatedWallet.balance}`)
    
    // Step 6: Check if bonus should be applied
    console.log('\n7. Checking if bonus should be applied...')
    const { data: currentPromotion, error: currentError } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotions (*)
      `)
      .eq('user_id', testUserId)
      .eq('status', 'active')
      .single()
    
    if (currentError && currentError.code !== 'PGRST116') {
      console.error('❌ Error fetching current promotion:', currentError)
      return
    }
    
    if (currentPromotion && currentPromotion.bonus_awarded === 0) {
      console.log(`✅ Found active promotion ready for bonus: ${currentPromotion.promotions.name}`)
      
      // Calculate bonus
      const bonusPercent = currentPromotion.promotions.bonus_percent
      const maxBonus = currentPromotion.promotions.max_bonus_amount
      const calculatedBonus = Math.min(depositAmount * (bonusPercent / 100), maxBonus)
      const wageringRequired = calculatedBonus * currentPromotion.promotions.wagering_multiplier
      
      console.log(`   Deposit amount: $${depositAmount}`)
      console.log(`   Bonus percent: ${bonusPercent}%`)
      console.log(`   Calculated bonus: $${calculatedBonus}`)
      console.log(`   Wagering required: $${wageringRequired}`)
      
      // Apply bonus
      const { data: bonusApplied, error: bonusError } = await supabase
        .from('user_promotions')
        .update({
          bonus_awarded: calculatedBonus,
          bonus_balance: calculatedBonus,
          wagering_required: wageringRequired,
          bonus_awarded_at: new Date().toISOString()
        })
        .eq('id', currentPromotion.id)
        .select()
        .single()
      
      if (bonusError) {
        console.error('❌ Error applying bonus:', bonusError)
        return
      }
      
      // Update wallet with bonus
      const { data: finalWallet, error: finalError } = await supabase
        .from('wallets')
        .update({ balance: updatedWallet.balance + calculatedBonus })
        .eq('user_id', testUserId)
        .select()
        .single()
      
      if (finalError) {
        console.error('❌ Error updating wallet with bonus:', finalError)
        return
      }
      
      console.log(`✅ Bonus applied successfully!`)
      console.log(`   Bonus amount: $${calculatedBonus}`)
      console.log(`   Final wallet balance: $${finalWallet.balance}`)
      console.log(`   Wagering required: $${wageringRequired}`)
      
      // Record transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          type: 'bonus_awarded',
          amount: calculatedBonus,
          description: `Deposit bonus from ${currentPromotion.promotions.name}`,
          status: 'completed'
        })
        .select()
        .single()
      
      if (transactionError) {
        console.error('❌ Error recording transaction:', transactionError)
        return
      }
      
      console.log(`✅ Transaction recorded: ${transaction.id}`)
      
    } else if (currentPromotion) {
      console.log(`ℹ️  Promotion already has bonus awarded: $${currentPromotion.bonus_awarded}`)
    } else {
      console.log('ℹ️  No active promotion found for bonus application')
    }
    
    // Final check
    console.log('\n8. Final state check...')
    const { data: finalWallet, error: finalWalletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', testUserId)
      .single()
    
    if (finalWalletError) {
      console.error('❌ Error fetching final wallet:', finalWalletError)
      return
    }
    
    const { data: finalPromotion, error: finalPromotionError } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotions (*)
      `)
      .eq('user_id', testUserId)
      .eq('status', 'active')
      .single()
    
    if (finalPromotionError && finalPromotionError.code !== 'PGRST116') {
      console.error('❌ Error fetching final promotion:', finalPromotionError)
      return
    }
    
    console.log(`✅ Final wallet balance: $${finalWallet.balance}`)
    if (finalPromotion) {
      console.log(`✅ Final promotion state:`)
      console.log(`   Bonus awarded: $${finalPromotion.bonus_awarded}`)
      console.log(`   Bonus balance: $${finalPromotion.bonus_balance}`)
      console.log(`   Wagering required: $${finalPromotion.wagering_required}`)
      console.log(`   Wagering completed: $${finalPromotion.wagering_completed}`)
    }
    
    console.log('\n=== DEPOSIT BONUS FLOW TEST COMPLETED ===')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

testDepositBonusFlow() 