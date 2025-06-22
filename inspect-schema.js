const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
  console.log('🔍 Inspecting database schema...\n');

  const tables = ['promotions', 'user_promotions', 'wallets', 'transactions'];

  for (const table of tables) {
    console.log(`📋 Table: ${table}`);
    console.log('─'.repeat(50));
    
    try {
      // Get sample data to see actual columns
      const { data: sampleData, error: sampleError } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (sampleError) {
        console.error(`❌ Error accessing ${table}:`, sampleError);
        continue;
      }

      if (sampleData && sampleData.length > 0) {
        const columns = Object.keys(sampleData[0]);
        console.log('Columns:', columns.join(', '));
        
        // Show sample data structure
        console.log('Sample data structure:');
        console.log(JSON.stringify(sampleData[0], null, 2));
      } else {
        console.log('No data found in table');
      }
      
      console.log('');
    } catch (error) {
      console.error(`❌ Error inspecting ${table}:`, error);
    }
  }
}

inspectSchema().catch(console.error); 