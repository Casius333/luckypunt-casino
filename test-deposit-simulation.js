const https = require('https');
const http = require('http');

const SUPABASE_AUTH_COOKIE = 'sb-lexsfcrpmzgadmbwnrwp-auth-token=eyJhbGciOiJIUzI1NiIsImtpZCI6ImRXbi9scFpPUTdLUjlQNXciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2xleHNmY3JwbXpnYWRtYnducndwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiODYwMmQ2Mi0xZTliLTQyNzMtYmU5OC0wNTY2OGEzY2I5YmQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwMzc4NTM5LCJpYXQiOjE3NTAzNzQ5MzksImVtYWlsIjoiY2hhZEBjaGFkbGVvbi5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiY2hhZEBjaGFkbGVvbi5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJiODYwMmQ2Mi0xZTliLTQyNzMtYmU5OC0wNTY2OGEzY2I5YmQifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1MDM3MTI0M31dLCJzZXNzaW9uX2lkIjoiZTJiMWY1MmEtODcwOS00NDk4LWE4YTEtZWFhYTc0ODUwZTdmIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.BmVjE6SV-zwNka4UeFkLnrlJF31nZKa4YLD2f7ORokA';

async function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Cookie': SUPABASE_AUTH_COOKIE,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    };
    
    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testDepositSimulation() {
  console.log('🧪 Testing deposit simulation...');
  
  try {
    // Test the deposit route with a small amount
    const depositResponse = await makeRequest(
      'http://localhost:3333/api/wallet/test-deposit',
      'POST',
      { amount: 100 }
    );
    
    console.log('📊 Deposit response:');
    console.log('Status:', depositResponse.status);
    console.log('Data:', depositResponse.data);
    
    if (depositResponse.status === 200) {
      console.log('✅ Deposit route authentication successful!');
      
      // Now test the debug endpoint
      const debugResponse = await makeRequest('http://localhost:3333/api/debug/deposit-bonus-check');
      
      console.log('📊 Debug endpoint response:');
      console.log('Status:', debugResponse.status);
      console.log('Data:', debugResponse.data);
      
      if (debugResponse.status === 200) {
        console.log('✅ Debug endpoint authentication successful!');
      } else {
        console.log('❌ Debug endpoint authentication failed');
      }
    } else {
      console.log('❌ Deposit route authentication failed');
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testDepositSimulation(); 