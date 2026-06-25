const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');
const path = require('path');
const fs = require('fs');

const dummyPdf = path.join(__dirname, 'dummy.pdf');
const orphanName = `يتيم تجريبي ${Date.now()}`;

test.beforeAll(() => {
  // PDF بسيط يجتاز فحص magic bytes
  fs.writeFileSync(dummyPdf, Buffer.from('25504446', 'hex'));
});

test.afterAll(() => {
  if (fs.existsSync(dummyPdf)) fs.unlinkSync(dummyPdf);
});

test.describe('تسجيل يتيم جديد', () => {

  test('مندوب يسجل يتيم جديد بنجاح', async ({ page }) => {
    await login(page, 'agent');
    await page.goto('/orphans/new');

    await page.fill('input[name="fullName"]', orphanName);
    await page.fill('input[name="dateOfBirth"]', '2015-03-15');
    await page.selectOption('select[name="gender"]', 'male');
    await page.selectOption('select[name="governorateId"]', { index: 1 });
    await page.fill('input[name="guardianName"]', 'ولي أمر تجريبي');
    await page.selectOption('select[name="guardianRelation"]', 'uncle');

    // رفع المستندات
    await page.setInputFiles('input[name="deathCert"]', dummyPdf);
    await page.setInputFiles('input[name="birthCert"]', dummyPdf);

    await page.click('button[type="submit"], button:has-text("حفظ")');

    await expect(
      page.locator('text=تم تسجيل, text=بنجاح').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('المشرف يشوف اليتيم المسجل ويغير حالته', async ({ page }) => {
    await login(page, 'supervisor');
    await page.goto('/orphans');

    await expect(page.locator(`text=${orphanName}`)).toBeVisible({ timeout: 10000 });
    await page.click(`text=${orphanName}`);

    // تغيير الحالة إلى قيد المراجعة أو تحت التسويق
    const changeBtn = page.locator('button:has-text("تغيير الحالة"), button:has-text("تعديل الحالة")');
    await changeBtn.click();
    await page.selectOption('select[name="status"], select', 'under_marketing');
    await page.click('button:has-text("حفظ"), button:has-text("تأكيد")');

    await expect(
      page.locator('text=تم تحديث, text=بنجاح').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('اليتيم يظهر في قائمة التسويق', async ({ page }) => {
    await login(page, 'supervisor');
    await page.goto('/marketing-pool');
    await expect(page.locator(`text=${orphanName}`)).toBeVisible({ timeout: 10000 });
  });

});
