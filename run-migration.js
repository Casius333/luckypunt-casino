const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('Adding type column to promotions table...')
    
    // Add the type column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE promotions 
        ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'deposit';
      `
    })

    if (alterError) {
      console.error('Error adding type column:', alterError)
      return
    }

    console.log('✅ Type column added successfully')

    // Update existing promotions
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE promotions 
        SET type = 'deposit' 
        WHERE type IS NULL OR type = '';
      `
    })

    if (updateError) {
      console.error('Error updating existing promotions:', updateError)
      return
    }

    console.log('✅ Existing promotions updated with type = "deposit"')

    // Verify the changes
    const { data: promotions, error: selectError } = await supabase
      .from('promotions')
      .select('id, name, type, bonus_percent, max_bonus_amount, min_deposit_amount, wagering_multiplier')
      .limit(5)

    if (selectError) {
      console.error('Error verifying changes:', selectError)
      return
    }

    console.log('✅ Verification - Sample promotions:')
    console.table(promotions)

  } catch (error) {
    console.error('Migration failed:', error)
  }
}

runMigration() 