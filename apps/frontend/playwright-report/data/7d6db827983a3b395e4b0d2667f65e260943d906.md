# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-sponsorship.spec.js >> الكفالة >> GM يضيف كافل جديد
- Location: e2e\04-sponsorship.spec.js:8:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"], button:has-text("حفظ"), button:has-text("إضافة")')
    - locator resolved to 2 elements. Proceeding with the first one: <button class="jsx-61d1621160332dfe btn-primary">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="jsx-f90c09b0a9ec863 modal-backdrop"></div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="jsx-f90c09b0a9ec863 modal-backdrop"></div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    48 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="jsx-f90c09b0a9ec863 modal-backdrop"></div> intercepts pointer events
     - retrying click action
       - waiting 500ms

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
          - paragraph [ref=e31]: الأيتام والأسر
          - generic [ref=e32]:
            - link "الأيتام" [ref=e33] [cursor=pointer]:
              - /url: /orphans
              - img [ref=e34]
              - generic [ref=e39]: الأيتام
            - link "الأسر" [ref=e40] [cursor=pointer]:
              - /url: /families
              - img [ref=e41]
              - generic [ref=e44]: الأسر
            - link "أيتامي" [ref=e45] [cursor=pointer]:
              - /url: /my-orphans
              - img [ref=e46]
              - generic [ref=e51]: أيتامي
            - link "الأيتام الموهوبون" [ref=e52] [cursor=pointer]:
              - /url: /orphans/gifted
              - img [ref=e53]
              - generic [ref=e55]: الأيتام الموهوبون
            - link "مجمع التسويق" [ref=e56] [cursor=pointer]:
              - /url: /marketing-pool
              - img [ref=e57]
              - generic [ref=e60]: مجمع التسويق
            - link "تسجيل يتيم" [ref=e61] [cursor=pointer]:
              - /url: /orphans/new
              - img [ref=e62]
              - generic [ref=e63]: تسجيل يتيم
            - link "تسجيل أسرة" [ref=e64] [cursor=pointer]:
              - /url: /families/new
              - img [ref=e65]
              - generic [ref=e66]: تسجيل أسرة
        - generic [ref=e67]:
          - paragraph [ref=e68]: الكفلاء والتسجيل
          - generic [ref=e69]:
            - link "الكفلاء" [ref=e70] [cursor=pointer]:
              - /url: /sponsors
              - img [ref=e71]
              - generic [ref=e76]: الكفلاء
            - link "طلبات التسجيل" [ref=e77] [cursor=pointer]:
              - /url: /registrations
              - img [ref=e78]
              - generic [ref=e81]: طلبات التسجيل
        - generic [ref=e82]:
          - paragraph [ref=e83]: القرآن الكريم
          - generic [ref=e84]:
            - link "إعدادات الحفظ" [ref=e85] [cursor=pointer]:
              - /url: /quran-thresholds
              - img [ref=e86]
              - generic [ref=e88]: إعدادات الحفظ
            - link "مراجعة تقارير الحفظ" [ref=e89] [cursor=pointer]:
              - /url: /quran-reports
              - img [ref=e90]
              - generic [ref=e93]: مراجعة تقارير الحفظ
            - link "رفع تقرير الحفظ" [ref=e94] [cursor=pointer]:
              - /url: /quran-reports/new
              - img [ref=e95]
              - generic [ref=e97]: رفع تقرير الحفظ
        - generic [ref=e98]:
          - paragraph [ref=e99]: المالية
          - generic [ref=e100]:
            - link "كشف الصرف" [ref=e101] [cursor=pointer]:
              - /url: /disbursements
              - img [ref=e102]
              - generic [ref=e104]: كشف الصرف
            - link "سجل الإصدارات" [ref=e105] [cursor=pointer]:
              - /url: /disbursements/history
              - img [ref=e106]
              - generic [ref=e109]: سجل الإصدارات
        - generic [ref=e110]:
          - paragraph [ref=e111]: التقارير والتواصل
          - generic [ref=e112]:
            - link "تحليلات المحافظات" [ref=e113] [cursor=pointer]:
              - /url: /governorates
              - img [ref=e114]
              - generic [ref=e116]: تحليلات المحافظات
            - link "التقارير" [ref=e117] [cursor=pointer]:
              - /url: /reports
              - img [ref=e118]
              - generic [ref=e121]: التقارير
            - link "الإعلانات" [ref=e122] [cursor=pointer]:
              - /url: /announcements
              - img [ref=e123]
              - generic [ref=e126]: الإعلانات
        - generic [ref=e127]:
          - paragraph [ref=e128]: النظام
          - link "إدارة المستخدمين" [ref=e130] [cursor=pointer]:
            - /url: /users
            - img [ref=e131]
            - generic [ref=e143]: إدارة المستخدمين
      - generic [ref=e145]:
        - generic [ref=e146]:
          - paragraph [ref=e147]: مدير النظام
          - paragraph [ref=e148]: المدير العام
        - button "خروج" [ref=e149] [cursor=pointer]
    - main [ref=e150]:
      - generic [ref=e151]:
        - heading "الكفلاء" [level=1] [ref=e153]
        - generic [ref=e154]:
          - button "الإشعارات" [ref=e156] [cursor=pointer]:
            - img [ref=e157]
          - generic [ref=e160]: ٢٠‏/٠٥‏/٢٠٢٦
      - generic [ref=e161]:
        - generic [ref=e162]:
          - generic [ref=e163]:
            - generic [ref=e164]:
              - heading "إدارة الكفلاء" [level=1] [ref=e165]
              - paragraph [ref=e166]: 17 كافل · 9 كفالة نشطة
            - button "إضافة كافل جديد" [ref=e167] [cursor=pointer]:
              - img [ref=e168]
              - generic [ref=e169]: إضافة كافل جديد
          - generic [ref=e170]:
            - img
            - textbox "ابحث بالاسم أو البريد أو رقم الهاتف…" [ref=e171]: كافل تجريبي 1779226380730
            - button [ref=e172] [cursor=pointer]:
              - img [ref=e173]
          - generic [ref=e176]:
            - img [ref=e177]
            - heading "لا توجد نتائج مطابقة" [level=3] [ref=e182]
            - paragraph [ref=e183]: جرّب تغيير معايير البحث
        - generic [ref=e185]:
          - generic [ref=e186]:
            - heading "إضافة كافل جديد" [level=2] [ref=e187]
            - button [ref=e188] [cursor=pointer]:
              - img [ref=e189]
          - generic [ref=e192]:
            - generic [ref=e193]:
              - generic [ref=e194]: الاسم الكامل *
              - textbox "اسم الكافل كاملاً" [ref=e195]
            - generic [ref=e196]:
              - generic [ref=e197]: رقم الهاتف (اختياري)
              - textbox "+967 7XX XXX XXX" [ref=e198]: "777123456"
            - generic [ref=e199]:
              - generic [ref=e200]: البريد الإلكتروني (اختياري)
              - textbox "sponsor@example.com" [active] [ref=e201]: sponsor1779226385826@test.com
            - generic [ref=e202]:
              - generic [ref=e203]: كلمة مرور البوابة *
              - textbox "8 أحرف على الأقل" [ref=e204]
              - paragraph [ref=e205]: سيستخدمها الكافل للدخول إلى بوابته الخاصة
            - generic [ref=e206]:
              - button "إلغاء" [ref=e207] [cursor=pointer]
              - button "إضافة الكافل" [ref=e208] [cursor=pointer]
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | const { login } = require('./helpers');
  3  | 
  4  | const sponsorName = `كافل تجريبي ${Date.now()}`;
  5  | 
  6  | test.describe('الكفالة', () => {
  7  | 
  8  |   test('GM يضيف كافل جديد', async ({ page }) => {
  9  |     await login(page, 'gm');
  10 |     await page.goto('/sponsors');
  11 | 
  12 |     await page.click('button:has-text("إضافة كافل"), button:has-text("+ كافل")');
  13 | 
  14 |     await page.fill('input[name="fullName"], input[placeholder*="الاسم"]', sponsorName);
  15 |     await page.fill('input[name="phone"], input[type="tel"]', '777123456');
  16 |     await page.fill('input[name="email"], input[type="email"]', `sponsor${Date.now()}@test.com`);
  17 | 
> 18 |     await page.click('button[type="submit"], button:has-text("حفظ"), button:has-text("إضافة")');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  19 | 
  20 |     await expect(
  21 |       page.locator('text=تم إضافة, text=بنجاح').first()
  22 |     ).toBeVisible({ timeout: 8000 });
  23 |   });
  24 | 
  25 |   test('الكافل يظهر في قائمة الكفلاء', async ({ page }) => {
  26 |     await login(page, 'gm');
  27 |     await page.goto('/sponsors');
  28 |     await expect(page.locator(`text=${sponsorName}`)).toBeVisible({ timeout: 8000 });
  29 |   });
  30 | 
  31 |   test('GM يعين مستفيد للكافل', async ({ page }) => {
  32 |     await login(page, 'gm');
  33 |     await page.goto('/sponsors');
  34 | 
  35 |     await page.click(`text=${sponsorName}`);
  36 |     await page.click('button:has-text("تعيين مستفيد")');
  37 | 
  38 |     // اختيار أول مستفيد في القائمة
  39 |     const firstBeneficiary = page.locator('.listbox button, [role="listbox"] button').first();
  40 |     await expect(firstBeneficiary).toBeVisible({ timeout: 8000 });
  41 |     await firstBeneficiary.click();
  42 | 
  43 |     // تعبئة تفاصيل الكفالة
  44 |     await page.fill('input[name="monthlyAmount"], input[type="number"]', '30000');
  45 | 
  46 |     await page.click('button:has-text("تعيين المستفيد"), button[type="submit"]');
  47 | 
  48 |     await expect(
  49 |       page.locator('text=تم تعيين, text=بنجاح').first()
  50 |     ).toBeVisible({ timeout: 8000 });
  51 |   });
  52 | 
  53 |   test('الكفالة تظهر في تفاصيل الكافل', async ({ page }) => {
  54 |     await login(page, 'gm');
  55 |     await page.goto('/sponsors');
  56 |     await page.click(`text=${sponsorName}`);
  57 | 
  58 |     // يشوف جدول الكفالات
  59 |     await expect(page.locator('.spon-table, table').first()).toBeVisible({ timeout: 8000 });
  60 |     await expect(page.locator('text=نشطة').first()).toBeVisible();
  61 |   });
  62 | 
  63 | });
  64 | 
```