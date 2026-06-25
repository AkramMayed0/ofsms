# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-auth.spec.js >> Auth — تسجيل الدخول والصلاحيات >> GM يقدر يسجل دخول ويشوف السايدبار كامل
- Location: e2e\01-auth.spec.js:6:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('navigation')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('navigation')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - paragraph [ref=e4]: جارٍ التحقق من الجلسة…
  - button "Open Next.js Dev Tools" [ref=e10] [cursor=pointer]:
    - img [ref=e11]
  - alert [ref=e14]
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | const { login, logout } = require('./helpers');
  3  | 
  4  | test.describe('Auth — تسجيل الدخول والصلاحيات', () => {
  5  | 
  6  |   test('GM يقدر يسجل دخول ويشوف السايدبار كامل', async ({ page }) => {
  7  |     await login(page, 'gm');
  8  |     await expect(page.getByRole('heading', { name: 'لوحة التحكم' })).toBeVisible();
  9  |     // بعد إغلاق وإعادة فتح (localStorage)
  10 |     await page.reload();
> 11 |     await expect(page.getByRole('navigation')).toBeVisible();
     |                                                ^ Error: expect(locator).toBeVisible() failed
  12 |   });
  13 | 
  14 |   test('مندوب يسجل دخول ويشوف فقط صلاحياته', async ({ page }) => {
  15 |     await login(page, 'agent');
  16 |     await expect(page.getByRole('link', { name: 'تسجيل يتيم' })).toBeVisible();
  17 |     // صفحة الكفلاء ما تكون متاحة
  18 |     await page.goto('/sponsors');
  19 |     await expect(page).toHaveURL(/\/dashboard/);
  20 |   });
  21 | 
  22 |   test('بيانات الجلسة تبقى بعد reload', async ({ page }) => {
  23 |     await login(page, 'supervisor');
  24 |     await page.reload();
  25 |     // ما يرجع لصفحة اللوجين
  26 |     await expect(page).not.toHaveURL(/\/login/);
  27 |     await expect(page.getByRole('navigation')).toBeVisible();
  28 |   });
  29 | 
  30 |   test('تسجيل الخروج يمسح الجلسة', async ({ page }) => {
  31 |     await login(page, 'agent');
  32 |     await logout(page);
  33 |     await expect(page).toHaveURL(/\/login/);
  34 |     // لو حاول يدخل على صفحة محمية يرجع للوجين
  35 |     await page.goto('/orphans');
  36 |     await expect(page).toHaveURL(/\/login/);
  37 |   });
  38 | 
  39 |   test('بيانات خاطئة تظهر خطأ', async ({ page }) => {
  40 |     await page.goto('/login');
  41 |     await page.fill('input[type="email"]', 'wrong@test.com');
  42 |     await page.fill('input[type="password"]', 'wrongpassword');
  43 |     await page.click('button[type="submit"]');
  44 |     await expect(page.locator('.error-banner')).toContainText('غير صحيحة', { timeout: 5000 });
  45 |   });
  46 | 
  47 | });
  48 | 
```