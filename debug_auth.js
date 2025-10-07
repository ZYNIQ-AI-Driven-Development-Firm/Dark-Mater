// Simple auth test for debugging
// Paste this in browser console after login

console.log('=== AUTH DEBUG TEST ===');

// Check stored tokens
console.log('1. Stored tokens:');
console.log('dark_matter_access_token:', localStorage.getItem('dark_matter_access_token') ? 'EXISTS' : 'MISSING');
console.log('access_token:', localStorage.getItem('access_token') ? 'EXISTS' : 'MISSING');

// Test our new API client
console.log('2. Testing new API client...');
import('http://localhost:5173/src/lib/api.js').then(({ serversApi }) => {
  console.log('serversApi:', serversApi);
  
  // Test a simple authenticated call
  serversApi.list().then(result => {
    console.log('✅ serversApi.list() success:', result);
  }).catch(error => {
    console.log('❌ serversApi.list() failed:', error);
  });
});

// Test legacy API client  
console.log('3. Testing legacy API client...');
window.ApiClient?.getServers?.().then(result => {
  console.log('✅ ApiClient.getServers() success:', result);
}).catch(error => {
  console.log('❌ ApiClient.getServers() failed:', error);
});