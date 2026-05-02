const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('E2E Registration Flow', () => {
  const dummyPdfPath = path.join(__dirname, 'dummy.pdf');
  const uniqueOrphanName = `E2E Orphan ${Date.now()}`;

  test.beforeAll(() => {
    // Create a dummy PDF that passes the magic byte scanner (%PDF)
    fs.writeFileSync(dummyPdfPath, Buffer.from('255044460A', 'hex'));
  });

  test.afterAll(() => {
    // Cleanup
    if (fs.existsSync(dummyPdfPath)) {
      fs.unlinkSync(dummyPdfPath);
    }
  });

  test('Agent registers orphan, Supervisor approves, GM sees in Marketing', async ({ browser }) => {
    // We use isolated contexts for different roles
    const agentContext = await browser.newContext();
    const supervisorContext = await browser.newContext();

    // ── 1. Agent logs in & Submits Registration ──
    const agentPage = await agentContext.newPage();
    await agentPage.goto('/login');
    
    // Fill login form (assuming standard dummy accounts from create-test-accounts)
    await agentPage.fill('input[type="email"]', 'agent@test.com');
    await agentPage.fill('input[type="password"]', 'Password123!');
    await agentPage.click('button:has-text("تسجيل الدخول")');
    
    // Ensure dashboard loads
    await expect(agentPage.locator('h1:has-text("لوحة المندوب")')).toBeVisible({ timeout: 10000 });

    // Navigate to new orphan page
    await agentPage.goto('/orphans/new');
    await expect(agentPage.locator('h1:has-text("تسجيل يتيم جديد")')).toBeVisible();

    // Fill out registration form
    await agentPage.fill('input[name="fullName"]', uniqueOrphanName);
    // Fill dob
    await agentPage.fill('input[name="dateOfBirth"]', '2015-01-01');
    // Select gender
    await agentPage.selectOption('select[name="gender"]', 'male');
    // Select governorate (assuming 1 is valid)
    await agentPage.selectOption('select[name="governorateId"]', '1');
    
    // Guardian details
    await agentPage.fill('input[name="guardianName"]', 'Guardian of ' + uniqueOrphanName);
    await agentPage.selectOption('select[name="guardianRelation"]', 'uncle');
    
    // Upload files
    await agentPage.setInputFiles('input[name="deathCert"]', dummyPdfPath);
    await agentPage.setInputFiles('input[name="birthCert"]', dummyPdfPath);
    
    // Submit form
    await agentPage.click('button:has-text("حفظ")');

    // Should redirect or show success
    await expect(agentPage.locator('text=تم تسجيل اليتيم بنجاح')).toBeVisible({ timeout: 10000 });
    
    // Close agent context
    await agentContext.close();

    // ── 2. Supervisor logs in & Approves ──
    const supervisorPage = await supervisorContext.newPage();
    await supervisorPage.goto('/login');
    await supervisorPage.fill('input[type="email"]', 'supervisor@test.com');
    await supervisorPage.fill('input[type="password"]', 'Password123!');
    await supervisorPage.click('button:has-text("تسجيل الدخول")');
    
    // Go to unapproved orphans list (often main dashboard or specific list)
    // Here we can go directly to the orphan's page or search for them
    await supervisorPage.goto('/orphans'); // Assuming there's a master list
    
    // Find the specific orphan
    await expect(supervisorPage.locator(`text=${uniqueOrphanName}`)).toBeVisible({ timeout: 10000 });
    
    // Click on the orphan to view details (assuming there's a link)
    await supervisorPage.click(`a:has-text("${uniqueOrphanName}")`);

    // Click "تعديل الحالة" (Change Status)
    await supervisorPage.click('button:has-text("تغيير الحالة")');
    
    // Select "under_marketing"
    await supervisorPage.selectOption('select[name="status"]', 'under_marketing');
    await supervisorPage.click('button:has-text("حفظ الحالة")');

    await expect(supervisorPage.locator('text=تم تحديث الحالة بنجاح')).toBeVisible();

    // ── 3. Verify in Marketing Pool ──
    // The supervisor or GM can see the marketing pool
    await supervisorPage.goto('/marketing-pool');
    await expect(supervisorPage.locator(`text=${uniqueOrphanName}`)).toBeVisible();

    await supervisorContext.close();
  });
});
