# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-orphan-registration.spec.js >> تسجيل يتيم جديد >> اليتيم يظهر في قائمة التسويق
- Location: e2e\02-orphan-registration.spec.js:60:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=يتيم تجريبي 1779226299798')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=يتيم تجريبي 1779226299798')

```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | const { login } = require('./helpers');
  3  | const path = require('path');
  4  | const fs = require('fs');
  5  | 
  6  | const dummyPdf = path.join(__dirname, 'dummy.pdf');
  7  | const orphanName = `يتيم تجريبي ${Date.now()}`;
  8  | 
  9  | test.beforeAll(() => {
  10 |   // PDF بسيط يجتاز فحص magic bytes
  11 |   fs.writeFileSync(dummyPdf, Buffer.from('25504446', 'hex'));
  12 | });
  13 | 
  14 | test.afterAll(() => {
  15 |   if (fs.existsSync(dummyPdf)) fs.unlinkSync(dummyPdf);
  16 | });
  17 | 
  18 | test.describe('تسجيل يتيم جديد', () => {
  19 | 
  20 |   test('مندوب يسجل يتيم جديد بنجاح', async ({ page }) => {
  21 |     await login(page, 'agent');
  22 |     await page.goto('/orphans/new');
  23 | 
  24 |     await page.fill('input[name="fullName"]', orphanName);
  25 |     await page.fill('input[name="dateOfBirth"]', '2015-03-15');
  26 |     await page.selectOption('select[name="gender"]', 'male');
  27 |     await page.selectOption('select[name="governorateId"]', { index: 1 });
  28 |     await page.fill('input[name="guardianName"]', 'ولي أمر تجريبي');
  29 |     await page.selectOption('select[name="guardianRelation"]', 'uncle');
  30 | 
  31 |     // رفع المستندات
  32 |     await page.setInputFiles('input[name="deathCert"]', dummyPdf);
  33 |     await page.setInputFiles('input[name="birthCert"]', dummyPdf);
  34 | 
  35 |     await page.click('button[type="submit"], button:has-text("حفظ")');
  36 | 
  37 |     await expect(
  38 |       page.locator('text=تم تسجيل, text=بنجاح').first()
  39 |     ).toBeVisible({ timeout: 10000 });
  40 |   });
  41 | 
  42 |   test('المشرف يشوف اليتيم المسجل ويغير حالته', async ({ page }) => {
  43 |     await login(page, 'supervisor');
  44 |     await page.goto('/orphans');
  45 | 
  46 |     await expect(page.locator(`text=${orphanName}`)).toBeVisible({ timeout: 10000 });
  47 |     await page.click(`text=${orphanName}`);
  48 | 
  49 |     // تغيير الحالة إلى قيد المراجعة أو تحت التسويق
  50 |     const changeBtn = page.locator('button:has-text("تغيير الحالة"), button:has-text("تعديل الحالة")');
  51 |     await changeBtn.click();
  52 |     await page.selectOption('select[name="status"], select', 'under_marketing');
  53 |     await page.click('button:has-text("حفظ"), button:has-text("تأكيد")');
  54 | 
  55 |     await expect(
  56 |       page.locator('text=تم تحديث, text=بنجاح').first()
  57 |     ).toBeVisible({ timeout: 5000 });
  58 |   });
  59 | 
  60 |   test('اليتيم يظهر في قائمة التسويق', async ({ page }) => {
  61 |     await login(page, 'supervisor');
  62 |     await page.goto('/marketing-pool');
> 63 |     await expect(page.locator(`text=${orphanName}`)).toBeVisible({ timeout: 10000 });
     |                                                      ^ Error: expect(locator).toBeVisible() failed
  64 |   });
  65 | 
  66 | });
  67 | 
```