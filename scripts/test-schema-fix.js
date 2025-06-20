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

async function testSchemaFix() {
  console.log('🧪 Testing schema fix with bonus_balance...\n')

  try {
    // Test 1: Insert with all required fields
    console.log('1. Testing insert with all required fields...')
    const { data: testRecord, error: insertError } = await supabase
      .from('user_promotions')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        promotion_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        status: 'active',
        bonus_amount: 0,
        bonus_balance: 0, // Now required
        wagering_requirement: 0,
        wagering_progress: 0
      })
      .select()
      .single()

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message)
      console.log('Error details:', insertError)
    } else {
      console.log('✅ Insert successful')
      console.log('Test record:', testRecord)
      
      // Clean up test record
      await supabase
        .from('user_promotions')
        .delete()
        .eq('id', testRecord.id)
      
      console.log('✅ Test record cleaned up')
    }

    // Test 2: Test with actual bonus values
    console.log('\n2. Testing insert with actual bonus values...')
    const { data: testRecord2, error: insertError2 } = await supabase
      .from('user_promotions')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        promotion_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        status: 'active',
        bonus_amount: 50,
        bonus_balance: 50, // Match bonus_amount
        wagering_requirement: 1250, // 50 * 25x wagering
        wagering_progress: 0
      })
      .select()
      .single()

    if (insertError2) {
      console.log('❌ Bonus insert failed:', insertError2.message)
    } else {
      console.log('✅ Bonus insert successful')
      console.log('Test record with bonus:', testRecord2)
      
      // Clean up test record
      await supabase
        .from('user_promotions')
        .delete()
        .eq('id', testRecord2.id)
      
      console.log('✅ Bonus test record cleaned up')
    }

    console.log('\n🎉 Schema fix test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testSchemaFix() 