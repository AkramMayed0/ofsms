# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-quran-reports.spec.js >> تقارير حفظ القرآن >> مشرف يرفض تقرير مع ملاحظة
- Location: e2e\03-quran-reports.spec.js:52:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.reject-btn, button[title="رفض"]').first()
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('.reject-btn, button[title="رفض"]').first()

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e12]:
    - complementary [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]:
          - text: نظام إدارة
          - text: الأيتام والأسر
        - button [ref=e16] [cursor=pointer]:
          - img [ref=e17]
      - navigation [ref=e19]:
        - generic [ref=e20]:
          - paragraph [ref=e21]: الرئيسية
          - link "لوحة التحكم" [ref=e23] [cursor=pointer]:
            - /url: /dashboard
            - img [ref=e24]
            - generic [ref=e29]: لوحة التحكم
        - generic [ref=e30]:
          - paragraph [ref=e31]: الإدارة
          - link "طلبات التسجيل" [ref=e33] [cursor=pointer]:
            - /url: /registrations
            - img [ref=e34]
            - generic [ref=e37]: طلبات التسجيل
        - generic [ref=e38]:
          - paragraph [ref=e39]: القرآن والحفظ
          - link "تقارير الحفظ" [ref=e41] [cursor=pointer]:
            - /url: /quran-reports
            - img [ref=e42]
            - generic [ref=e44]: تقارير الحفظ
        - generic [ref=e45]:
          - paragraph [ref=e46]: المالية
          - link "كشف الصرف" [ref=e48] [cursor=pointer]:
            - /url: /disbursements
            - img [ref=e49]
            - generic [ref=e51]: كشف الصرف
        - generic [ref=e52]:
          - paragraph [ref=e53]: التقارير والتواصل
          - generic [ref=e54]:
            - link "التقارير" [ref=e55] [cursor=pointer]:
              - /url: /reports
              - img [ref=e56]
              - generic [ref=e59]: التقارير
            - link "الإعلانات" [ref=e60] [cursor=pointer]:
              - /url: /announcements
              - img [ref=e61]
              - generic [ref=e64]: الإعلانات
      - generic [ref=e66]:
        - generic [ref=e67]:
          - paragraph [ref=e68]: مشرف الأيتام
          - paragraph [ref=e69]: مشرف الأيتام
        - button "خروج" [ref=e70] [cursor=pointer]
    - main [ref=e71]:
      - generic [ref=e72]:
        - heading "تقارير الحفظ" [level=1] [ref=e74]
        - generic [ref=e75]:
          - button "الإشعارات" [ref=e77] [cursor=pointer]:
            - img [ref=e78]
          - generic [ref=e81]: ٢٠‏/٠٥‏/٢٠٢٦
      - generic [ref=e83]:
        - generic [ref=e85]:
          - heading "تقارير حفظ القرآن" [level=1] [ref=e86]
          - paragraph [ref=e87]: 9 تقرير · 0 قيد المراجعة
        - generic [ref=e88]:
          - generic [ref=e89]:
            - generic [ref=e90]: "9"
            - generic [ref=e91]: إجمالي التقارير
          - generic [ref=e92]:
            - generic [ref=e93]: "0"
            - generic [ref=e94]: قيد المراجعة
          - generic [ref=e95]:
            - generic [ref=e96]: "8"
            - generic [ref=e97]: معتمدة
          - generic [ref=e98]:
            - generic [ref=e99]: "1"
            - generic [ref=e100]: مرفوضة
        - generic [ref=e101]:
          - button "الكل 9" [ref=e102] [cursor=pointer]:
            - text: الكل
            - generic [ref=e103]: "9"
          - button "قيد المراجعة 0" [active] [ref=e104] [cursor=pointer]:
            - text: قيد المراجعة
            - generic [ref=e105]: "0"
          - button "المعتمدة 8" [ref=e106] [cursor=pointer]:
            - text: المعتمدة
            - generic [ref=e107]: "8"
          - button "المرفوضة 1" [ref=e108] [cursor=pointer]:
            - text: المرفوضة
            - generic [ref=e109]: "1"
        - generic [ref=e110]:
          - img [ref=e112]
          - heading "لا توجد تقارير بهذه الحالة" [level=3] [ref=e114]
          - paragraph [ref=e115]: جرّب تغيير فلتر الحالة لعرض تقارير أخرى
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | const { login } = require('./helpers');
  3  | 
  4  | test.describe('تقارير حفظ القرآن', () => {
  5  | 
  6  |   test('مندوب يرفع تقرير حفظ', async ({ page }) => {
  7  |     await login(page, 'agent');
  8  |     await page.goto('/quran-reports');
  9  | 
  10 |     await page.click('button:has-text("رفع تقرير جديد"), button:has-text("+ رفع")');
  11 | 
  12 |     // اختيار أول يتيم في القائمة
  13 |     await page.selectOption('select[name="orphanId"], select', { index: 1 });
  14 | 
  15 |     // اختيار الشهر والسنة
  16 |     await page.selectOption('select[name="month"]', { index: 0 });
  17 |     await page.selectOption('select[name="year"]', '2026');
  18 | 
  19 |     // رفع عدد الأجزاء (زر +)
  20 |     await page.click('button:has-text("+")');
  21 |     await page.click('button:has-text("+")');
  22 | 
  23 |     await page.click('button:has-text("رفع التقرير"), button[type="submit"]');
  24 | 
  25 |     await expect(
  26 |       page.locator('text=تم رفع, text=بنجاح, text=قيد المراجعة').first()
  27 |     ).toBeVisible({ timeout: 8000 });
  28 |   });
  29 | 
  30 |   test('مشرف يوافق على تقرير الحفظ', async ({ page }) => {
  31 |     await login(page, 'supervisor');
  32 |     await page.goto('/quran-reports');
  33 | 
  34 |     // فلترة على قيد المراجعة
  35 |     await page.click('button:has-text("قيد المراجعة")');
  36 | 
  37 |     // موافقة على أول تقرير
  38 |     const approveBtn = page.locator('.approve-btn, button[title="موافقة"]').first();
  39 |     await expect(approveBtn).toBeVisible({ timeout: 8000 });
  40 |     await approveBtn.click();
  41 | 
  42 |     // لو ظهر تأكيد (تقرير أقل من الحد) — نكمل
  43 |     page.on('dialog', async dialog => {
  44 |       await dialog.accept();
  45 |     });
  46 | 
  47 |     await expect(
  48 |       page.locator('text=معتمد').first()
  49 |     ).toBeVisible({ timeout: 8000 });
  50 |   });
  51 | 
  52 |   test('مشرف يرفض تقرير مع ملاحظة', async ({ page }) => {
  53 |     await login(page, 'supervisor');
  54 |     await page.goto('/quran-reports');
  55 | 
  56 |     await page.click('button:has-text("قيد المراجعة")');
  57 | 
  58 |     page.on('dialog', async dialog => {
  59 |       if (dialog.type() === 'prompt') await dialog.accept('الأجزاء المحفوظة أقل من المطلوب');
  60 |       else await dialog.accept();
  61 |     });
  62 | 
  63 |     const rejectBtn = page.locator('.reject-btn, button[title="رفض"]').first();
> 64 |     await expect(rejectBtn).toBeVisible({ timeout: 8000 });
     |                             ^ Error: expect(locator).toBeVisible() failed
  65 |     await rejectBtn.click();
  66 | 
  67 |     await expect(
  68 |       page.locator('text=مرفوض').first()
  69 |     ).toBeVisible({ timeout: 8000 });
  70 |   });
  71 | 
  72 | });
  73 | 
```