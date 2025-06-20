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
    console.log('Checking current promotions table structure...')
    
    // First, let's see what columns exist
    const { data: promotions, error: selectError } = await supabase
      .from('promotions')
      .select('*')
      .limit(1)

    if (selectError) {
      console.error('Error checking promotions table:', selectError)
      return
    }

    console.log('Current promotion columns:', Object.keys(promotions[0] || {}))

    // Check if type column already exists
    if (promotions[0] && 'type' in promotions[0]) {
      console.log('✅ Type column already exists')
    } else {
      console.log('❌ Type column does not exist - you need to add it manually')
      console.log('Please run this SQL in your Supabase dashboard:')
      console.log(`
        ALTER TABLE promotions 
        ADD COLUMN type TEXT DEFAULT 'deposit';
        
        UPDATE promotions 
        SET type = 'deposit' 
        WHERE type IS NULL OR type = '';
      `)
      return
    }

    // Update existing promotions to ensure they have type = 'deposit'
    const { error: updateError } = await supabase
      .from('promotions')
      .update({ type: 'deposit' })
      .is('type', null)

    if (updateError) {
      console.error('Error updating promotions:', updateError)
    } else {
      console.log('✅ Updated promotions with null type to "deposit"')
    }

    // Verify the changes
    const { data: updatedPromotions, error: verifyError } = await supabase
      .from('promotions')
      .select('id, name, type, bonus_percent, max_bonus_amount, min_deposit_amount, wagering_multiplier')
      .limit(5)

    if (verifyError) {
      console.error('Error verifying changes:', verifyError)
      return
    }

    console.log('✅ Verification - Sample promotions:')
    console.table(updatedPromotions)

  } catch (error) {
    console.error('Migration failed:', error)
  }
}

runMigration() 