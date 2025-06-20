const https = require('https');
const http = require('http');

// === Paste your Supabase session cookie value here ===
// Example: 'sb-xxxxxx-auth-token=eyJhbGciOi...'
const SUPABASE_AUTH_COOKIE = 'sb-lexsfcrpmzgadmbwnrwp-auth-token=eyJhbGciOiJIUzI1NiIsImtpZCI6ImRXbi9scFpPUTdLUjlQNXciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2xleHNmY3JwbXpnYWRtYnducndwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiODYwMmQ2Mi0xZTliLTQyNzMtYmU5OC0wNTY2OGEzY2I5YmQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwMzc4NTM5LCJpYXQiOjE3NTAzNzQ5MzksImVtYWlsIjoiY2hhZEBjaGFkbGVvbi5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiY2hhZEBjaGFkbGVvbi5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJiODYwMmQ2Mi0xZTliLTQyNzMtYmU5OC0wNTY2OGEzY2I5YmQifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1MDM3MTI0M31dLCJzZXNzaW9uX2lkIjoiZTJiMWY1MmEtODcwOS00NDk4LWE4YTEtZWFhYTc0ODUwZTdmIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.BmVjE6SV-zwNka4UeFkLnrlJF31nZKa4YLD2f7ORokA';

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const options = {
      headers: SUPABASE_AUTH_COOKIE
        ? { Cookie: SUPABASE_AUTH_COOKIE }
        : {},
    };
    const req = client.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    });
    req.on('error', (error) => {
      reject(error);
    });
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testDebugEndpoint() {
  if (!SUPABASE_AUTH_COOKIE) {
    console.error('\n❌ Please paste your Supabase session cookie value into SUPABASE_AUTH_COOKIE at the top of this file.');
    return;
  }
  console.log('🧪 Testing debug endpoint with authentication...');
  try {
    const data = await makeRequest('http://localhost:3333/api/debug/deposit-bonus-check');
    
    console.log('\n📊 DEBUG ENDPOINT RESULTS:');
    console.log('========================');
    console.log('User ID:', data.user_id);
    console.log('Active promotions count:', data.active_promotions_count);
    console.log('Deposit bonuses count:', data.deposit_bonuses_count);
    console.log('Current wallet balance:', data.current_wallet_balance);
    console.log('Would apply bonus:', data.would_apply_bonus);
    
    console.log('\n📋 ACTIVE PROMOTIONS:');
    if (data.active_promotions && data.active_promotions.length > 0) {
      data.active_promotions.forEach((promo, index) => {
        console.log(`\n  Promotion ${index + 1}:`);
        console.log(`    User Promotion ID: ${promo.id}`);
        console.log(`    Status: ${promo.status}`);
        console.log(`    Bonus Awarded: ${promo.bonus_awarded}`);
        console.log(`    Promotion Type: ${promo.promotions?.type}`);
        console.log(`    Promotion Name: ${promo.promotions?.name}`);
        console.log(`    Bonus Percent: ${promo.promotions?.bonus_percent}%`);
        console.log(`    Max Bonus: $${promo.promotions?.max_bonus_amount}`);
        console.log(`    Wagering Multiplier: ${promo.promotions?.wagering_multiplier}x`);
      });
    } else {
      console.log('  ❌ No active promotions found');
    }
    
    console.log('\n💰 DEPOSIT BONUSES:');
    if (data.deposit_bonuses && data.deposit_bonuses.length > 0) {
      data.deposit_bonuses.forEach((bonus, index) => {
        console.log(`\n  Deposit Bonus ${index + 1}:`);
        console.log(`    User Promotion ID: ${bonus.id}`);
        console.log(`    Promotion Name: ${bonus.promotions?.name}`);
        console.log(`    Type: ${bonus.promotions?.type}`);
        console.log(`    Status: ${bonus.status}`);
        console.log(`    Bonus Awarded: ${bonus.bonus_awarded}`);
      });
    } else {
      console.log('  ❌ No deposit bonuses found');
    }
    
    console.log('\n🧮 BONUS CALCULATIONS:');
    if (data.bonus_calculations && data.bonus_calculations.length > 0) {
      data.bonus_calculations.forEach((calc, index) => {
        console.log(`\n  Calculation ${index + 1}:`);
        console.log(`    Promotion: ${calc.promotion_name}`);
        console.log(`    Deposit Amount: $${calc.deposit_amount}`);
        console.log(`    Bonus Percent: ${calc.bonus_percent}%`);
        console.log(`    Max Bonus: $${calc.max_bonus}`);
        console.log(`    Calculated Bonus: $${calc.calculated_bonus}`);
        console.log(`    Wagering Required: $${calc.wagering_required}`);
        console.log(`    Would Be Awarded: ${calc.would_be_awarded ? '✅ YES' : '❌ NO'}`);
      });
    } else {
      console.log('  ❌ No bonus calculations available');
    }
    
    // DIAGNOSIS
    console.log('\n🔍 DIAGNOSIS:');
    console.log('============');
    
    if (data.active_promotions_count === 0) {
      console.log('❌ ISSUE: No active promotions found');
      console.log('   → Check if user has activated any promotions');
      console.log('   → Check if promotions exist in database');
    } else if (data.deposit_bonuses_count === 0) {
      console.log('❌ ISSUE: No deposit bonuses found among active promotions');
      console.log('   → Check if active promotions have type = "deposit"');
      console.log('   → Check promotion type values in database');
    } else if (!data.would_apply_bonus) {
      console.log('❌ ISSUE: Bonus would not be awarded');
      console.log('   → Check bonus calculation logic');
      console.log('   → Check bonus_percent and max_bonus_amount values');
    } else {
      console.log('✅ All conditions met - bonus should be awarded');
      console.log('   → Issue might be in the actual deposit route logic');
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Error testing debug endpoint:', error.message);
    return null;
  }
}

// Run the test
testDebugEndpoint().then(result => {
  if (result) {
    console.log('\n✅ Debug test completed successfully');
  } else {
    console.log('\n❌ Debug test failed');
  }
}); 