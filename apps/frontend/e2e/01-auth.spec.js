const { test, expect } = require('@playwright/test');
const { login, logout } = require('./helpers');

test.describe('Auth — تسجيل الدخول والصلاحيات', () => {

  test('GM يقدر يسجل دخول ويشوف السايدبار كامل', async ({ page }) => {
    await login(page, 'gm');
    await expect(page.locator('text=لوحة التحكم')).toBeVisible();
    // بعد إغلاق وإعادة فتح (localStorage)
    await page.reload();
    await expect(page.locator('nav, aside')).toBeVisible();
  });

  test('مندوب يسجل دخول ويشوف فقط صلاحياته', async ({ page }) => {
    await login(page, 'agent');
    await expect(page.locator('text=الأيتام')).toBeVisible();
    // صفحة الكفلاء ما تكون متاحة
    const response = await page.goto('/sponsors');
    expect(response?.status()).not.toBe(200);
  });

  test('بيانات الجلسة تبقى بعد reload', async ({ page }) => {
    await login(page, 'supervisor');
    await page.reload();
    // ما يرجع لصفحة اللوجين
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('nav, aside')).toBeVisible();
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
    await expect(page.locator('text=بيانات الدخول غير صحيحة, text=خطأ, text=غير صحيح').first()).toBeVisible({ timeout: 5000 });
  });

});
