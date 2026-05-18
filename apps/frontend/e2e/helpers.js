const { expect } = require('@playwright/test');

const ACCOUNTS = {
  gm:         { email: 'gm@test.com',         password: 'Password123!' },
  supervisor: { email: 'supervisor@test.com',  password: 'Password123!' },
  agent:      { email: 'agent@test.com',       password: 'Password123!' },
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
  const logoutBtn = page.locator('button:has-text("تسجيل الخروج"), a:has-text("تسجيل الخروج")');
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL('/login', { timeout: 5000 });
  } else {
    await page.goto('/login');
  }
}

module.exports = { login, logout, ACCOUNTS };
