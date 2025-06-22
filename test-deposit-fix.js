require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js')

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const TEST_USER_ID = 'b8602d62-1e9b-4273-be98-05668a3cb9bd' // Your test user ID

console.log('Environment check:', {
  SUPABASE_URL: SUPABASE_URL ? 'Set' : 'Missing',
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'Set' : 'Missing'
})

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testDepositFlow() {
  console.log('🧪 Testing Deposit Flow Fix')
  console.log('============================\n')

  try {
    // Step 1: Check current wallet state
    console.log('1️⃣ Checking current wallet state...')
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, user_id, balance, currency, created_at, updated_at')
      .eq('user_id', TEST_USER_ID)
      .single()

    if (walletError) {
      console.log('❌ Error fetching wallet:', walletError.message)
      return
    }

    const initialBalance = wallet?.balance || 0
    console.log(`✅ Current wallet balance: $${initialBalance.toFixed(2)}`)

    // Step 2: Test the API endpoint
    console.log('\n2️⃣ Testing deposit API endpoint...')
    const response = await fetch('http://localhost:3333/api/wallet/test-deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: 100 })
    })

    const responseData = await response.json()
    console.log('API Response Status:', response.status)
    console.log('API Response Data:', JSON.stringify(responseData, null, 2))

    if (!response.ok) {
      console.log('❌ API request failed')
      return
    }

    // Step 3: Verify wallet was updated
    console.log('\n3️⃣ Verifying wallet update...')
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single()

    if (updateError) {
      console.log('❌ Error fetching updated wallet:', updateError.message)
      return
    }

    const newBalance = updatedWallet?.balance || 0
    const expectedBalance = initialBalance + 100
    console.log(`✅ New wallet balance: $${newBalance.toFixed(2)}`)
    console.log(`✅ Expected balance: $${expectedBalance.toFixed(2)}`)
    
    if (Math.abs(newBalance - expectedBalance) < 0.01) {
      console.log('✅ Balance update successful!')
    } else {
      console.log('❌ Balance update failed - amounts do not match')
    }

    // Step 4: Check for transaction record
    console.log('\n4️⃣ Checking transaction record...')
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('type', 'test_deposit')
      .order('created_at', { ascending: false })
      .limit(1)

    if (txError) {
      console.log('❌ Error fetching transactions:', txError.message)
    } else if (transactions && transactions.length > 0) {
      console.log('✅ Transaction recorded:', {
        id: transactions[0].id,
        amount: transactions[0].amount,
        status: transactions[0].status
      })
    } else {
      console.log('⚠️ No transaction record found')
    }

    // Step 5: Test real deposit endpoint
    console.log('\n5️⃣ Testing real deposit endpoint...')
    const realDepositResponse = await fetch('http://localhost:3333/api/wallet/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: 50 })
    })

    const realDepositData = await realDepositResponse.json()
    console.log('Real Deposit Response Status:', realDepositResponse.status)
    console.log('Real Deposit Response Data:', JSON.stringify(realDepositData, null, 2))

    // Step 6: Final wallet check
    console.log('\n6️⃣ Final wallet check...')
    const { data: finalWallet, error: finalError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single()

    if (finalError) {
      console.log('❌ Error fetching final wallet:', finalError.message)
    } else {
      console.log(`✅ Final wallet balance: $${finalWallet?.balance?.toFixed(2) || '0.00'}`)
    }

    console.log('\n🎉 Deposit flow test completed!')

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testDepositFlow() 