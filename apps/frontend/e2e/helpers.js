const { expect } = require('@playwright/test');

const ACCOUNTS = {
  gm:         { email: 'gm@ofsms.local',         password: 'Test@1234' },
  supervisor: { email: 'supervisor@ofsms.local',  password: 'Test@1234' },
  agent:      { email: 'agent@ofsms.local',       password: 'Test@1234' },
};

async function login(page, role) {
  const { email, password } = ACCOUNTS[role];
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|orphans|reports)/, { timeout: 10000 });
}

async function logout(page) {
  // Click the logout button if visible in sidebar/header
  const logoutButtons = await page.locator('button:has-text("خروج"), button[title="تسجيل الخروج"], a:has-text("خروج")').all();
  const visibleLogoutBtn = await logoutButtons.reduce(async (found, btn) => {
    const current = await found;
    if (current) return current;
    return (await btn.isVisible()) ? btn : null;
  }, Promise.resolve(null));

  if (visibleLogoutBtn) {
    await visibleLogoutBtn.click();
    await page.waitForURL('/login', { timeout: 5000 });
  } else {
    await page.goto('/login');
  }
}

module.exports = { login, logout, ACCOUNTS };
