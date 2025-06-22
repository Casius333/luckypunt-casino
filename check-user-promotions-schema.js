const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserPromotionsSchema() {
  console.log('🔍 Checking user_promotions table schema...\n');

  try {
    // First, let's see if the table exists and get a sample row
    const { data: sampleData, error: sampleError } = await supabase
      .from('user_promotions')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error accessing user_promotions table:', sampleError);
      return;
    }

    console.log('✅ User_promotions table exists');
    console.log('📋 Sample data structure:');
    console.log(JSON.stringify(sampleData, null, 2));

    // Now let's try to get the table structure by attempting to select all columns
    const { data: allData, error: allError } = await supabase
      .from('user_promotions')
      .select('*');

    if (allError) {
      console.error('❌ Error selecting all columns:', allError);
      return;
    }

    if (allData && allData.length > 0) {
      console.log('\n📊 Available columns (from first row):');
      const columns = Object.keys(allData[0]);
      columns.forEach((col, index) => {
        console.log(`${index + 1}. ${col}`);
      });
    } else {
      console.log('\n📊 Table exists but has no data yet');
      // Try to insert a test row to see the structure
      console.log('Attempting to insert a test row to see structure...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('user_promotions')
        .insert({
          user_id: 'test-user-id',
          promotion_id: 'test-promotion-id',
          status: 'active',
          activated_at: new Date().toISOString()
        })
        .select();

      if (insertError) {
        console.error('❌ Error inserting test row:', insertError);
        return;
      }

      console.log('✅ Test row inserted successfully');
      console.log('📋 Structure from inserted row:');
      console.log(JSON.stringify(insertData[0], null, 2));

      // Clean up the test row
      await supabase
        .from('user_promotions')
        .delete()
        .eq('user_id', 'test-user-id');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUserPromotionsSchema(); 