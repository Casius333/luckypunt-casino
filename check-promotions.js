const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPromotions() {
  console.log('🔍 Checking promotions and user_promotions...');
  
  try {
    // Check all promotions
    const { data: promotions, error: promoError } = await supabase
      .from('promotions')
      .select('*');
    
    if (promoError) {
      console.error('❌ Error fetching promotions:', promoError);
      return;
    }
    
    console.log('📊 All promotions:', promotions?.length || 0);
    if (promotions && promotions.length > 0) {
      console.log('📋 Promotions data:', JSON.stringify(promotions, null, 2));
    }
    
    // Check user_promotions for the specific user
    const userId = 'b8602d62-1e9b-4273-be98-05668a3cb9bd';
    const { data: userPromotions, error: userPromoError } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotions (*)
      `)
      .eq('user_id', userId);
    
    if (userPromoError) {
      console.error('❌ Error fetching user_promotions:', userPromoError);
      return;
    }
    
    console.log('👤 User promotions for', userId + ':', userPromotions?.length || 0);
    if (userPromotions && userPromotions.length > 0) {
      console.log('📋 User promotions data:', JSON.stringify(userPromotions, null, 2));
    }
    
    // Check active user_promotions specifically
    const { data: activeUserPromotions, error: activeError } = await supabase
      .from('user_promotions')
      .select(`
        *,
        promotions (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (activeError) {
      console.error('❌ Error fetching active user_promotions:', activeError);
      return;
    }
    
    console.log('✅ Active user promotions:', activeUserPromotions?.length || 0);
    if (activeUserPromotions && activeUserPromotions.length > 0) {
      console.log('📋 Active user promotions data:', JSON.stringify(activeUserPromotions, null, 2));
    }
    
    // Check deposit-type active promotions
    const depositPromotions = activeUserPromotions?.filter(up => 
      up.promotions?.type === 'deposit'
    ) || [];
    
    console.log('💰 Deposit-type active promotions:', depositPromotions.length);
    if (depositPromotions.length > 0) {
      console.log('📋 Deposit promotions data:', JSON.stringify(depositPromotions, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPromotions(); 