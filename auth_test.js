/**
 * Simple auth test to verify bo  // Test direct fetch with stored token
console.log('=== DIRECT FETCH TEST ===');
const token = localStorage.getItem('dark_matter_access_token');
if (token) {
  fetch('http://localhost:8000/api/v1/servers', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(response => response.json()).then(result => {
    console.log('✅ Direct fetch SUCCESS:', result);
  }).catch(error => {
    console.log('❌ Direct fetch FAILED:', error);
  });
} else {
  console.log('❌ No token for direct fetch test');
}

// 5. Test enrollment directly
console.log('=== ENROLLMENT TEST ===');
if (token) {
  const testEnrollment = {
    name: "test-kali-browser",
    host: "192.168.1.100", 
    port: 8080,
    enrollment_id: "browser-test-id",
    enrollment_token: "browser-test-token",
    ssl_verify: false
  };
  
  fetch('http://localhost:8000/api/v1/servers/enroll', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testEnrollment)
  }).then(response => response.json()).then(result => {
    console.log('✅ Enrollment fetch SUCCESS:', result);
  }).catch(error => {
    console.log('❌ Enrollment fetch FAILED:', error);
  });
} work
 * Run this in browser console after login
 */

// 1. Check token storage
console.log('=== TOKEN STORAGE TEST ===');
const darkMatterToken = localStorage.getItem('dark_matter_access_token');
const accessToken = localStorage.getItem('access_token');
console.log('dark_matter_access_token:', darkMatterToken ? 'EXISTS' : 'MISSING');
console.log('access_token:', accessToken ? 'EXISTS' : 'MISSING');
console.log('Tokens match:', darkMatterToken === accessToken);

// 2. Test new API client (if available)
if (window.serversApi) {
  console.log('=== NEW API CLIENT TEST ===');
  window.serversApi.list().then(result => {
    console.log('✅ serversApi.list() SUCCESS:', result);
  }).catch(error => {
    console.log('❌ serversApi.list() FAILED:', error.response?.data || error.message);
  });
} else {
  console.log('❌ serversApi not available on window');
}

// 3. Test legacy API client
if (window.ApiClient) {
  console.log('=== LEGACY API CLIENT TEST ===');
  window.ApiClient.getServers().then(result => {
    console.log('✅ ApiClient.getServers() SUCCESS:', result);
  }).catch(error => {
    console.log('❌ ApiClient.getServers() FAILED:', error.message);
  });
} else {
  console.log('❌ ApiClient not available on window');
}

// 4. Test direct fetch with stored token
console.log('=== DIRECT FETCH TEST ===');
const token = localStorage.getItem('dark_matter_access_token');
if (token) {
  fetch('http://localhost:8000/api/v1/servers', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(response => response.json()).then(result => {
    console.log('✅ Direct fetch SUCCESS:', result);
  }).catch(error => {
    console.log('❌ Direct fetch FAILED:', error);
  });
} else {
  console.log('❌ No token for direct fetch test');
}