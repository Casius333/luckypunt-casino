const https = require('https');
const http = require('http');

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

async function testSimpleAuth() {
  console.log('🧪 Testing simple authentication...');
  
  try {
    // Test the debug endpoint
    const debugData = await makeRequest('http://localhost:3333/api/debug/deposit-bonus-check');
    
    console.log('📊 Debug endpoint response:');
    console.log('Status:', debugData.error ? 'ERROR' : 'SUCCESS');
    console.log('User ID:', debugData.user_id);
    console.log('Error details:', debugData.error || debugData.details);
    
    if (debugData.error) {
      console.log('❌ Authentication failed in debug endpoint');
      console.log('Error:', debugData.error);
      console.log('Details:', debugData.details);
    } else {
      console.log('✅ Authentication successful in debug endpoint');
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testSimpleAuth(); 