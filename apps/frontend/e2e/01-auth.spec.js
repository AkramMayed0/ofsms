const { test, expect } = require('@playwright/test');
const { login, logout } = require('./helpers');

test.describe('Auth — تسجيل الدخول والصلاحيات', () => {

  test('GM يقدر يسجل دخول ويشوف السايدبار كامل', async ({ page }) => {
    await login(page, 'gm');
    await expect(page.getByRole('heading', { name: 'لوحة التحكم' })).toBeVisible();
    // بعد إغلاق وإعادة فتح (localStorage)
    await page.reload();
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('مندوب يسجل دخول ويشوف فقط صلاحياته', async ({ page }) => {
    await login(page, 'agent');
    await expect(page.getByRole('link', { name: 'تسجيل يتيم' })).toBeVisible();
    // صفحة الكفلاء ما تكون متاحة
    await page.goto('/sponsors');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('بيانات الجلسة تبقى بعد reload', async ({ page }) => {
    await login(page, 'supervisor');
    await page.reload();
    // ما يرجع لصفحة اللوجين
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('تسجيل الخروج يمسح الجلسة', async ({ page }) => {
    await login(page, 'agent');
    await logout(page);
    await expect(page).toHaveURL(/\/login/);
    // لو حاول يدخل على صفحة محمية يرجع للوجين
    await page.goto('/orphans');
    await expect(page).toHaveURL(/\/login/);
  });

  test('بيانات خاطئة تظهر خطأ', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-banner')).toContainText('غير صحيحة', { timeout: 5000 });
  });

});
