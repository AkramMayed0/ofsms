const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

const sponsorName = `كافل تجريبي ${Date.now()}`;

test.describe('الكفالة', () => {

  test('GM يضيف كافل جديد', async ({ page }) => {
    await login(page, 'gm');
    await page.goto('/sponsors');

    await page.click('button:has-text("إضافة كافل"), button:has-text("+ كافل")');

    await page.fill('input[name="fullName"], input[placeholder*="الاسم"]', sponsorName);
    await page.fill('input[name="phone"], input[type="tel"]', '777123456');
    await page.fill('input[name="email"], input[type="email"]', `sponsor${Date.now()}@test.com`);

    await page.click('button[type="submit"], button:has-text("حفظ"), button:has-text("إضافة")');

    await expect(
      page.locator('text=تم إضافة, text=بنجاح').first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('الكافل يظهر في قائمة الكفلاء', async ({ page }) => {
    await login(page, 'gm');
    await page.goto('/sponsors');
    await expect(page.locator(`text=${sponsorName}`)).toBeVisible({ timeout: 8000 });
  });

  test('GM يعين مستفيد للكافل', async ({ page }) => {
    await login(page, 'gm');
    await page.goto('/sponsors');

    await page.click(`text=${sponsorName}`);
    await page.click('button:has-text("تعيين مستفيد")');

    // اختيار أول مستفيد في القائمة
    const firstBeneficiary = page.locator('.listbox button, [role="listbox"] button').first();
    await expect(firstBeneficiary).toBeVisible({ timeout: 8000 });
    await firstBeneficiary.click();

    // تعبئة تفاصيل الكفالة
    await page.fill('input[name="monthlyAmount"], input[type="number"]', '30000');

    await page.click('button:has-text("تعيين المستفيد"), button[type="submit"]');

    await expect(
      page.locator('text=تم تعيين, text=بنجاح').first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('الكفالة تظهر في تفاصيل الكافل', async ({ page }) => {
    await login(page, 'gm');
    await page.goto('/sponsors');
    await page.click(`text=${sponsorName}`);

    // يشوف جدول الكفالات
    await expect(page.locator('.spon-table, table').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=نشطة').first()).toBeVisible();
  });

});
