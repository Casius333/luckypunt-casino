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

async function fixSchema() {
  console.log('🔧 Fixing user_promotions table schema...\n')

  try {
    // 1. Make deposit_amount nullable (since we don't use it in new flow)
    console.log('1. Making deposit_amount nullable...')
    const { error: depositError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_promotions 
        ALTER COLUMN deposit_amount DROP NOT NULL;
      `
    })

    if (depositError) {
      console.log('Note: deposit_amount column may already be nullable or not exist')
    } else {
      console.log('✅ deposit_amount made nullable')
    }

    // 1.5. Make bonus_balance nullable (since it starts at 0)
    console.log('\n1.5. Making bonus_balance nullable...')
    const { error: bonusBalanceError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_promotions 
        ALTER COLUMN bonus_balance DROP NOT NULL;
      `
    })

    if (bonusBalanceError) {
      console.log('Note: bonus_balance column may already be nullable or not exist')
    } else {
      console.log('✅ bonus_balance made nullable')
    }

    // 2. Add missing columns if they don't exist
    console.log('\n2. Adding missing columns...')
    
    // Add bonus_amount column
    const { error: bonusError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_promotions 
        ADD COLUMN IF NOT EXISTS bonus_amount DECIMAL(10,2) DEFAULT 0;
      `
    })

    if (bonusError) {
      console.log('Note: bonus_amount column may already exist')
    } else {
      console.log('✅ bonus_amount column added')
    }

    // Add wagering_requirement column
    const { error: wageringError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_promotions 
        ADD COLUMN IF NOT EXISTS wagering_requirement DECIMAL(10,2) DEFAULT 0;
      `
    })

    if (wageringError) {
      console.log('Note: wagering_requirement column may already exist')
    } else {
      console.log('✅ wagering_requirement column added')
    }

    // Add updated_at column
    const { error: updatedError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_promotions 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `
    })

    if (updatedError) {
      console.log('Note: updated_at column may already exist')
    } else {
      console.log('✅ updated_at column added')
    }

    // 3. Test the schema with a minimal insert
    console.log('\n3. Testing schema with minimal insert...')
    const { data: testRecord, error: testError } = await supabase
      .from('user_promotions')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        promotion_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        status: 'active',
        bonus_amount: 0,
        wagering_requirement: 0
        // deposit_amount is now nullable, so we don't need to provide it
      })
      .select()
      .single()

    if (testError) {
      console.log('❌ Test insert failed:', testError.message)
      console.log('Error details:', testError)
    } else {
      console.log('✅ Test insert successful')
      console.log('Test record:', testRecord)
      
      // Clean up test record
      await supabase
        .from('user_promotions')
        .delete()
        .eq('id', testRecord.id)
      
      console.log('✅ Test record cleaned up')
    }

    console.log('\n🎉 Schema fix completed!')

  } catch (error) {
    console.error('❌ Error fixing schema:', error)
  }
}

// Run the script
fixSchema() 