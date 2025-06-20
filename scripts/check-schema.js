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

async function checkSchema() {
  console.log('🔍 Checking user_promotions table schema...\n')

  try {
    // Try to insert a test record with only basic columns
    console.log('1. Testing insert with basic columns...')
    const { data: testRecord, error: insertError } = await supabase
      .from('user_promotions')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        promotion_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        status: 'active'
      })
      .select()
      .single()

    if (insertError) {
      console.log('❌ Basic insert failed:')
      console.log('Error:', insertError.message)
    } else {
      console.log('✅ Basic insert successful')
      console.log('Test record:', testRecord)
      
      // Clean up test record
      await supabase
        .from('user_promotions')
        .delete()
        .eq('id', testRecord.id)
    }

    // Try to select from the table to see what columns exist
    console.log('\n2. Checking existing columns...')
    const { data: existingRecords, error: selectError } = await supabase
      .from('user_promotions')
      .select('*')
      .limit(1)

    if (selectError) {
      console.log('❌ Select failed:', selectError.message)
    } else {
      console.log('✅ Select successful')
      if (existingRecords && existingRecords.length > 0) {
        console.log('Sample record structure:')
        console.log(JSON.stringify(existingRecords[0], null, 2))
      } else {
        console.log('Table is empty, no sample records')
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
checkSchema() 