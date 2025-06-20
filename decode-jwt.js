const jwt = require('jsonwebtoken');

// The JWT token from the cookie
const token = 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImRXbi9scFpPUTdLUjlQNXciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2xleHNmY3JwbXpnYWRtYnducndwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiODYwMmQ2Mi0xZTliLTQyNzMtYmU5OC0wNTY2OGEzY2I5YmQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwMzc4NTM5LCJpYXQiOjE3NTAzNzQ5MzksImVtYWlsIjoiY2hhZEBjaGFkbGVvbi5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiY2hhZEBjaGFkbGVvbi5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJiODYwMmQ2Mi0xZTliLTQyNzMtYmU5OC0wNTY2OGEzY2I5YmQifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1MDM3MTI0M31dLCJzZXNzaW9uX2lkIjoiZTJiMWY1MmEtODcwOS00NDk4LWE4YTEtZWFhYTc0ODUwZTdmIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.BmVjE6SV-zwNka4UeFkLnrlJF31nZKa4YLD2f7ORokA';

try {
  // Decode the JWT without verification (since we don't have the secret)
  const decoded = jwt.decode(token);
  
  console.log('🔍 JWT Token Analysis:');
  console.log('========================');
  console.log('User ID (sub):', decoded.sub);
  console.log('Email:', decoded.email);
  console.log('Issued at (iat):', new Date(decoded.iat * 1000).toISOString());
  console.log('Expires at (exp):', new Date(decoded.exp * 1000).toISOString());
  console.log('Current time:', new Date().toISOString());
  
  const now = Math.floor(Date.now() / 1000);
  const isExpired = decoded.exp < now;
  
  console.log('Token expired:', isExpired);
  console.log('Time until expiry:', decoded.exp - now, 'seconds');
  
  if (isExpired) {
    console.log('❌ Token is expired! This is why authentication is failing.');
  } else {
    console.log('✅ Token is still valid.');
  }
  
} catch (error) {
  console.error('Error decoding JWT:', error);
} 