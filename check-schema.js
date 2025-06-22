const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking promotions table schema...\n');

  try {
    // First, let's see if the table exists and get a sample row
    const { data: sampleData, error: sampleError } = await supabase
      .from('promotions')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error accessing promotions table:', sampleError);
      return;
    }

    console.log('✅ Promotions table exists');
    console.log('📋 Sample data structure:');
    console.log(JSON.stringify(sampleData, null, 2));

    // Now let's try to get the table structure by attempting to select all columns
    const { data: allData, error: allError } = await supabase
      .from('promotions')
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
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSchema(); 