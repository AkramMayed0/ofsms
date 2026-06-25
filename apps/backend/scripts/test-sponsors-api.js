const http = require('http');
process.env.AWS_ACCESS_KEY_ID = 'test';
const app = require('../src/index');

const PORT = 4020;
let server;
let gmToken;
let agentToken;
let agentId;
let familyId;
let orphanId;
let nonSponsoredOrphanId;
let sponsorId;
let portalToken;

const runTests = async () => {
  console.log('--- Starting Integration Tests for Sponsors Module ---\n');

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
  gmToken = loginData.accessToken;
  console.log('✅ 1. GM Login successful.');

  const gmHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${gmToken}`
  };

  // 2. Create Agent
  console.log('\n--- Creating test Agent ---');
  res = await fetch(`http://localhost:${PORT}/api/users`, {
    method: 'POST',
    headers: gmHeaders,
    body: JSON.stringify({
      fullName: 'مندوب تجريبي كفالات',
      email: `agent_sponsor_${Date.now()}@test.local`,
      password: 'password123',
      role: 'agent',
      phone: `079${Math.floor(Math.random() * 10000000)}`
    })
  });
  let agentData = await res.json();
  if (res.status === 201) {
    agentId = agentData.user.id;
    console.log('✅ 2. Create Agent successful. Agent ID:', agentId);
  } else {
    console.error('❌ 2. Create Agent failed:', agentData);
    process.exit(1);
  }

  // 3. Login as Agent
  res = await fetch(`http://localhost:${PORT}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: agentData.user.email, password: 'password123' })
  });
  const agentLoginData = await res.json();
  agentToken = agentLoginData.accessToken;
  console.log('✅ 3. Agent Login successful.');

  const agentHeaders = {
    'Authorization': `Bearer ${agentToken}`
  };

  // 4. Create Family (Agent)
  console.log('\n--- Creating test Family ---');
  const familyForm = new FormData();
  familyForm.append('familyName', 'عائلة كفالة تجريبية');
  familyForm.append('headOfFamily', 'رب أسرة تجريبي');
  familyForm.append('memberCount', '4');
  familyForm.append('governorateId', '1');

  res = await fetch(`http://localhost:${PORT}/api/families`, {
    method: 'POST',
    headers: agentHeaders,
    body: familyForm
  });
  let familyData = await res.json();
  if (res.status === 201) {
    familyId = familyData.family.id;
    console.log('✅ 4. Create Family successful. Family ID:', familyId);
  } else {
    console.error('❌ 4. Create Family failed:', familyData);
    process.exit(1);
  }

  const pngMagicBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x00]);
  const dummyFile = new Blob([pngMagicBytes], { type: 'image/png' });

  // 5. Create Sponsored Orphan (Agent)
  console.log('\n--- Creating test Orphan ---');
  const orphanForm = new FormData();
  orphanForm.append('fullName', 'يتيم كفالة تجريبية');
  orphanForm.append('dateOfBirth', '2015-05-15');
  orphanForm.append('gender', 'male');
  orphanForm.append('governorateId', '1');
  orphanForm.append('guardianName', 'وصي تجريبي');
  orphanForm.append('guardianRelation', 'uncle');
  orphanForm.append('deathCert', dummyFile, 'death.png');
  orphanForm.append('birthCert', dummyFile, 'birth.png');

  res = await fetch(`http://localhost:${PORT}/api/orphans`, {
    method: 'POST',
    headers: agentHeaders,
    body: orphanForm
  });
  let orphanData = await res.json();
  if (res.status === 201) {
    orphanId = orphanData.orphan.id;
    console.log('✅ 5. Create Orphan successful. Orphan ID:', orphanId);
  } else {
    console.error('❌ 5. Create Orphan failed:', orphanData);
    process.exit(1);
  }

  // 6. Create Non-Sponsored Orphan (Agent)
  console.log('\n--- Creating non-sponsored test Orphan ---');
  const nonSponsoredForm = new FormData();
  nonSponsoredForm.append('fullName', 'يتيم غير مكفول تجريبي');
  nonSponsoredForm.append('dateOfBirth', '2016-06-16');
  nonSponsoredForm.append('gender', 'female');
  nonSponsoredForm.append('governorateId', '1');
  nonSponsoredForm.append('guardianName', 'وصي تجريبي آخر');
  nonSponsoredForm.append('guardianRelation', 'grandfather');
  nonSponsoredForm.append('deathCert', dummyFile, 'death.png');
  nonSponsoredForm.append('birthCert', dummyFile, 'birth.png');

  res = await fetch(`http://localhost:${PORT}/api/orphans`, {
    method: 'POST',
    headers: agentHeaders,
    body: nonSponsoredForm
  });
  let nonSponsoredData = await res.json();
  if (res.status === 201) {
    nonSponsoredOrphanId = nonSponsoredData.orphan.id;
    console.log('✅ 6. Create non-sponsored Orphan successful. ID:', nonSponsoredOrphanId);
  } else {
    console.error('❌ 6. Create non-sponsored Orphan failed:', nonSponsoredData);
    process.exit(1);
  }

  // 7. Approve Family & Orphans to 'under_marketing' (GM)
  console.log('\n--- Approving Family & Orphans to under_marketing ---');
  await fetch(`http://localhost:${PORT}/api/families/${familyId}/status`, {
    method: 'PATCH',
    headers: gmHeaders,
    body: JSON.stringify({ status: 'under_marketing' })
  });
  await fetch(`http://localhost:${PORT}/api/orphans/${orphanId}/status`, {
    method: 'PATCH',
    headers: gmHeaders,
    body: JSON.stringify({ status: 'under_marketing' })
  });
  await fetch(`http://localhost:${PORT}/api/orphans/${nonSponsoredOrphanId}/status`, {
    method: 'PATCH',
    headers: gmHeaders,
    body: JSON.stringify({ status: 'under_marketing' })
  });
  console.log('✅ 7. Status approved to under_marketing.');

  // 8. Create Sponsor (GM)
  console.log('\n--- Creating Sponsor ---');
  res = await fetch(`http://localhost:${PORT}/api/sponsors`, {
    method: 'POST',
    headers: gmHeaders,
    body: JSON.stringify({
      fullName: 'كافل تجريبي جديد',
      email: `sponsor_${Date.now()}@test.local`,
      phone: `078${Math.floor(Math.random() * 10000000)}`,
      portalPassword: 'portalPassword123'
    })
  });
  let sponsorData = await res.json();
  if (res.status === 201) {
    sponsorId = sponsorData.sponsor.id;
    portalToken = sponsorData.sponsor.portal_token;
    console.log('✅ 8. Sponsor created successfully. Sponsor ID:', sponsorId);
  } else {
    console.error('❌ 8. Sponsor creation failed:', sponsorData);
    process.exit(1);
  }

  // 9. Assign Orphan Sponsorship (GM)
  console.log('\n--- Assigning Orphan Sponsorship ---');
  res = await fetch(`http://localhost:${PORT}/api/sponsors/${sponsorId}/sponsorships`, {
    method: 'POST',
    headers: gmHeaders,
    body: JSON.stringify({
      beneficiaryType: 'orphan',
      beneficiaryId: orphanId,
      agentId: agentId,
      startDate: new Date().toISOString().split('T')[0],
      monthlyAmount: 60.5
    })
  });
  let sshipOrphanData = await res.json();
  if (res.status === 201) {
    console.log('✅ 9. Orphan sponsorship created successfully.');
  } else {
    console.error('❌ 9. Orphan sponsorship creation failed:', sshipOrphanData);
    process.exit(1);
  }

  // 10. Assign Family Sponsorship (GM)
  console.log('\n--- Assigning Family Sponsorship ---');
  res = await fetch(`http://localhost:${PORT}/api/sponsors/${sponsorId}/sponsorships`, {
    method: 'POST',
    headers: gmHeaders,
    body: JSON.stringify({
      beneficiaryType: 'family',
      beneficiaryId: familyId,
      agentId: agentId,
      startDate: new Date().toISOString().split('T')[0],
      monthlyAmount: 120.0
    })
  });
  let sshipFamilyData = await res.json();
  if (res.status === 201) {
    console.log('✅ 10. Family sponsorship created successfully.');
  } else {
    console.error('❌ 10. Family sponsorship creation failed:', sshipFamilyData);
    process.exit(1);
  }

  // 11. Verify Beneficiary Status flips to under_sponsorship
  console.log('\n--- Verifying beneficiary statuses flipped to under_sponsorship ---');
  let famVerifyRes = await fetch(`http://localhost:${PORT}/api/families/${familyId}`, { headers: gmHeaders });
  let famVerify = await famVerifyRes.json();
  let orphVerifyRes = await fetch(`http://localhost:${PORT}/api/orphans/${orphanId}`, { headers: gmHeaders });
  let orphVerify = await orphVerifyRes.json();

  if (famVerify.family.status === 'under_sponsorship' && orphVerify.orphan.status === 'under_sponsorship') {
    console.log('✅ 11. Beneficiaries are now under_sponsorship.');
  } else {
    console.error('❌ 11. Status flip check failed. Family status:', famVerify.family.status, 'Orphan status:', orphVerify.orphan.status);
    process.exit(1);
  }

  // 12. Fetch Sponsor Portfolio Details (GM)
  console.log('\n--- Fetching Sponsor Portfolio (GM) ---');
  res = await fetch(`http://localhost:${PORT}/api/sponsors/${sponsorId}/portfolio`, { headers: gmHeaders });
  let portfolioData = await res.json();
  if (res.status === 200 && portfolioData.summary.active_sponsorships === 2) {
    console.log('✅ 12. Sponsor portfolio fetched successfully. Active count:', portfolioData.summary.active_sponsorships);
  } else {
    console.error('❌ 12. Fetch sponsor portfolio failed:', portfolioData);
    process.exit(1);
  }

  // 13. Login to Sponsor Portal (Sponsor)
  console.log('\n--- Sponsor Portal: Logging in ---');
  res = await fetch(`http://localhost:${PORT}/api/sponsor/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      portalToken: portalToken,
      password: 'portalPassword123'
    })
  });
  let portalLoginData = await res.json();
  if (res.status === 200 && portalLoginData.accessToken) {
    console.log('✅ 13. Sponsor portal login successful.');
  } else {
    console.error('❌ 13. Sponsor portal login failed:', portalLoginData);
    process.exit(1);
  }

  const portalHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${portalLoginData.accessToken}`
  };

  // 14. Sponsor Portal: Get /me
  console.log('\n--- Sponsor Portal: GET /me ---');
  res = await fetch(`http://localhost:${PORT}/api/sponsor/me`, { headers: portalHeaders });
  let meData = await res.json();
  if (res.status === 200 && meData.sponsor.full_name === 'كافل تجريبي جديد') {
    console.log('✅ 14. GET /me successful.');
  } else {
    console.error('❌ 14. GET /me failed:', meData);
    process.exit(1);
  }

  // 15. Sponsor Portal: GET /orphans
  console.log('\n--- Sponsor Portal: GET /orphans ---');
  res = await fetch(`http://localhost:${PORT}/api/sponsor/orphans`, { headers: portalHeaders });
  let portalOrphans = await res.json();
  if (res.status === 200 && portalOrphans.total === 1 && portalOrphans.orphans[0].id === orphanId) {
    console.log('✅ 15. GET /orphans successful. Returned 1 sponsored orphan.');
  } else {
    console.error('❌ 15. GET /orphans failed:', portalOrphans);
    process.exit(1);
  }

  // 16. Sponsor Portal: GET /reports/:orphanId (Sponsored Orphan)
  console.log('\n--- Sponsor Portal: GET /reports/:orphanId (Sponsored) ---');
  res = await fetch(`http://localhost:${PORT}/api/sponsor/reports/${orphanId}`, { headers: portalHeaders });
  let reportData = await res.json();
  if (res.status === 200 && Array.isArray(reportData.quran_reports) && Array.isArray(reportData.disbursements)) {
    console.log('✅ 16. GET /reports successful for sponsored orphan.');
  } else {
    console.error('❌ 16. GET /reports failed:', reportData);
    process.exit(1);
  }

  // 17. Sponsor Portal: GET /reports/:orphanId (Non-Sponsored Orphan - ownership check)
  console.log('\n--- Sponsor Portal: GET /reports/:orphanId (Non-Sponsored, check ownership) ---');
  res = await fetch(`http://localhost:${PORT}/api/sponsor/reports/${nonSponsoredOrphanId}`, { headers: portalHeaders });
  let forbiddenData = await res.json();
  if (res.status === 403) {
    console.log('✅ 17. Ownership check successfully blocked access (403 Forbidden).');
  } else {
    console.error('❌ 17. Ownership check failed to block access. Status:', res.status, forbiddenData);
    process.exit(1);
  }

  // 18. Attempt Delete Sponsor (Blocked by active sponsorships)
  console.log('\n--- Attempting to delete sponsor with active sponsorships (should block) ---');
  res = await fetch(`http://localhost:${PORT}/api/sponsors/${sponsorId}`, {
    method: 'DELETE',
    headers: gmHeaders
  });
  let deleteBlockData = await res.json();
  if (res.status === 400 && deleteBlockData.error.includes('كفالات نشطة')) {
    console.log('✅ 18. Delete successfully blocked with correct warning.');
  } else {
    console.error('❌ 18. Delete blocking failed. Status:', res.status, deleteBlockData);
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
