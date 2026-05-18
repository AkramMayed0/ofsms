const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test.describe('تقارير حفظ القرآن', () => {

  test('مندوب يرفع تقرير حفظ', async ({ page }) => {
    await login(page, 'agent');
    await page.goto('/quran-reports');

    await page.click('button:has-text("رفع تقرير جديد"), button:has-text("+ رفع")');

    // اختيار أول يتيم في القائمة
    await page.selectOption('select[name="orphanId"], select', { index: 1 });

    // اختيار الشهر والسنة
    await page.selectOption('select[name="month"]', { index: 0 });
    await page.selectOption('select[name="year"]', '2026');

    // رفع عدد الأجزاء (زر +)
    await page.click('button:has-text("+")');
    await page.click('button:has-text("+")');

    await page.click('button:has-text("رفع التقرير"), button[type="submit"]');

    await expect(
      page.locator('text=تم رفع, text=بنجاح, text=قيد المراجعة').first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('مشرف يوافق على تقرير الحفظ', async ({ page }) => {
    await login(page, 'supervisor');
    await page.goto('/quran-reports');

    // فلترة على قيد المراجعة
    await page.click('button:has-text("قيد المراجعة")');

    // موافقة على أول تقرير
    const approveBtn = page.locator('.approve-btn, button[title="موافقة"]').first();
    await expect(approveBtn).toBeVisible({ timeout: 8000 });
    await approveBtn.click();

    // لو ظهر تأكيد (تقرير أقل من الحد) — نكمل
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await expect(
      page.locator('text=معتمد').first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('مشرف يرفض تقرير مع ملاحظة', async ({ page }) => {
    await login(page, 'supervisor');
    await page.goto('/quran-reports');

    await page.click('button:has-text("قيد المراجعة")');

    page.on('dialog', async dialog => {
      if (dialog.type() === 'prompt') await dialog.accept('الأجزاء المحفوظة أقل من المطلوب');
      else await dialog.accept();
    });

    const rejectBtn = page.locator('.reject-btn, button[title="رفض"]').first();
    await expect(rejectBtn).toBeVisible({ timeout: 8000 });
    await rejectBtn.click();

    await expect(
      page.locator('text=مرفوض').first()
    ).toBeVisible({ timeout: 8000 });
  });

});
