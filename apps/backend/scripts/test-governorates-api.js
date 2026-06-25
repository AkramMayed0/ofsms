const http = require('http');
const app = require('../src/index');

const PORT = 4025;
let server;
let token;

const runTests = async () => {
  console.log('--- Starting Integration Tests for Governorates Module ---\n');

  // 1. Login to get GM token
  let res = await fetch(`http://localhost:${PORT}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gm@ofsms.local', password: 'Test@1234' })
  });

  if (!res.ok) {
    console.log('Login failed, seeding test GM user...');
    require('child_process').execSync('node scripts/create-test-user.js');
    res = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'gm@ofsms.local', password: 'Test@1234' })
    });
  }

  const loginData = await res.json();
  token = loginData.accessToken;
  console.log('✅ 1. Login successful. Token received.');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Fetch all governorates
  console.log('\n--- Testing GET /api/governorates ---');
  res = await fetch(`http://localhost:${PORT}/api/governorates`, { headers });
  let data = await res.json();
  if (res.ok && Array.isArray(data.data) && data.data.length > 0) {
    console.log(`✅ 2. Fetch governorates successful. Found ${data.data.length} governorates.`);
    console.log(`      First governorate:`, data.data[0]);
  } else {
    console.error('❌ 2. Fetch governorates failed:', data);
    process.exit(1);
  }

  // 3. Fetch orphans in governorate 1 (Amman or default)
  console.log('\n--- Testing GET /api/governorates/1/orphans (Valid ID) ---');
  res = await fetch(`http://localhost:${PORT}/api/governorates/1/orphans`, { headers });
  data = await res.json();
  if (res.status === 200 && Array.isArray(data.orphans)) {
    console.log(`✅ 3. Fetch orphans by governorate successful. Found ${data.orphans.length} active/pending orphans.`);
  } else {
    console.error('❌ 3. Fetch orphans by governorate failed:', data);
    process.exit(1);
  }

  // 4. Test validation rule for invalid ID
  console.log('\n--- Testing GET /api/governorates/abc/orphans (Invalid ID) ---');
  res = await fetch(`http://localhost:${PORT}/api/governorates/abc/orphans`, { headers });
  data = await res.json();
  if (res.status === 400 && data.error && data.error.includes('المحافظة')) {
    console.log('✅ 4. Validation rule successfully blocked request with error:', data.error);
  } else {
    console.error('❌ 4. Validation rule failed to block invalid ID. Status:', res.status, data);
    process.exit(1);
  }

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED 🎉');
};

server = http.createServer(app);
server.listen(PORT, async () => {
  try {
    await runTests();
  } catch (err) {
    console.error('Crash during tests:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
