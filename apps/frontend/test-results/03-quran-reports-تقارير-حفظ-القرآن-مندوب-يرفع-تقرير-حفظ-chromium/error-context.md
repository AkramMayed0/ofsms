# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-quran-reports.spec.js >> تقارير حفظ القرآن >> مندوب يرفع تقرير حفظ
- Location: e2e\03-quran-reports.spec.js:6:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("رفع تقرير جديد"), button:has-text("+ رفع")')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
          - generic [ref=e22]:
            - link "لوحة التحكم" [ref=e23] [cursor=pointer]:
              - /url: /dashboard
              - img [ref=e24]
              - generic [ref=e29]: لوحة التحكم
            - link "أيتامي" [ref=e30] [cursor=pointer]:
              - /url: /my-orphans
              - img [ref=e31]
              - generic [ref=e36]: أيتامي
        - generic [ref=e37]:
          - paragraph [ref=e38]: التسجيل
          - generic [ref=e39]:
            - link "تسجيل يتيم" [ref=e40] [cursor=pointer]:
              - /url: /orphans/new
              - img [ref=e41]
              - generic [ref=e42]: تسجيل يتيم
            - link "تسجيل أسرة" [ref=e43] [cursor=pointer]:
              - /url: /families/new
              - img [ref=e44]
              - generic [ref=e45]: تسجيل أسرة
        - generic [ref=e46]:
          - paragraph [ref=e47]: القرآن الكريم
          - link "رفع تقرير الحفظ" [ref=e49] [cursor=pointer]:
            - /url: /quran-reports/new
            - img [ref=e50]
            - generic [ref=e52]: رفع تقرير الحفظ
        - generic [ref=e53]:
          - paragraph [ref=e54]: التواصل
          - link "الإعلانات" [ref=e56] [cursor=pointer]:
            - /url: /announcements
            - img [ref=e57]
            - generic [ref=e60]: الإعلانات
      - generic [ref=e62]:
        - generic [ref=e63]:
          - paragraph [ref=e64]: مندوب التسجيل
          - paragraph [ref=e65]: مندوب
        - button "خروج" [ref=e66] [cursor=pointer]
    - main [ref=e67]:
      - generic [ref=e68]:
        - heading "لوحة التحكم" [level=1] [ref=e70]
        - generic [ref=e71]:
          - button "الإشعارات" [ref=e73] [cursor=pointer]:
            - img [ref=e74]
          - generic [ref=e77]: ٢٠‏/٠٥‏/٢٠٢٦
      - generic [ref=e80]:
        - generic [ref=e81]:
          - generic [ref=e82]:
            - heading "مرحباً" [level=1] [ref=e83]
            - paragraph [ref=e84]: الأربعاء، ٢٠ مايو ٢٠٢٦
          - button "+ تسجيل يتيم جديد" [ref=e85] [cursor=pointer]
        - generic [ref=e86]:
          - generic [ref=e87] [cursor=pointer]:
            - generic [ref=e88]:
              - img [ref=e90]
              - generic [ref=e95]: "3"
            - generic [ref=e96]: إجمالي الأيتام
            - generic [ref=e97]: المسجّلون باسمك
          - generic [ref=e99]:
            - generic [ref=e100]:
              - img [ref=e102]
              - generic [ref=e105]: "3"
            - generic [ref=e106]: تحت الكفالة
            - generic [ref=e107]: يتيم مكفول حالياً
          - generic [ref=e109]:
            - generic [ref=e110]:
              - img [ref=e112]
              - generic [ref=e115]: "0"
            - generic [ref=e116]: قيد المراجعة
            - generic [ref=e117]: بانتظار قرار المشرف
          - generic [ref=e119]:
            - generic [ref=e120]:
              - img [ref=e122]
              - generic [ref=e124]: "0"
            - generic [ref=e125]: تقارير معلّقة
            - generic [ref=e126]: لا تقارير معلّقة
        - generic [ref=e128]:
          - heading "توزيع الحالات" [level=2] [ref=e130]
          - generic [ref=e131]:
            - generic [ref=e133]:
              - generic [ref=e134]: قيد المراجعة
              - generic [ref=e135]: "0"
            - generic [ref=e138]:
              - generic [ref=e139]: تحت التسويق
              - generic [ref=e140]: "0"
            - generic [ref=e143]:
              - generic [ref=e144]: تحت الكفالة
              - generic [ref=e145]: "3"
            - generic [ref=e149]:
              - generic [ref=e150]: مرفوض
              - generic [ref=e151]: "0"
            - generic [ref=e154]:
              - generic [ref=e155]: غير نشط
              - generic [ref=e156]: "0"
        - generic [ref=e158]:
          - generic [ref=e159]:
            - heading "آخر الأيتام المسجّلين" [level=2] [ref=e160]
            - button "عرض الكل →" [ref=e161] [cursor=pointer]
          - table [ref=e163]:
            - rowgroup [ref=e164]:
              - row "الاسم المحافظة العمر الحالة تاريخ التسجيل" [ref=e165]:
                - columnheader "الاسم" [ref=e166]
                - columnheader "المحافظة" [ref=e167]
                - columnheader "العمر" [ref=e168]
                - columnheader "الحالة" [ref=e169]
                - columnheader "تاريخ التسجيل" [ref=e170]
            - rowgroup [ref=e171]:
              - row "A Agent Orphan أمانة العاصمة 11 سنة تحت الكفالة ١٧‏/٠٥‏/٢٠٢٦" [ref=e172] [cursor=pointer]:
                - cell "A Agent Orphan" [ref=e173]:
                  - generic [ref=e174]:
                    - generic [ref=e175]: A
                    - generic [ref=e177]: Agent Orphan
                - cell "أمانة العاصمة" [ref=e178]
                - cell "11 سنة" [ref=e179]
                - cell "تحت الكفالة" [ref=e180]:
                  - generic [ref=e181]: تحت الكفالة
                - cell "١٧‏/٠٥‏/٢٠٢٦" [ref=e183]
              - row "s salah ali حجة 26 سنة تحت الكفالة ٠٢‏/٠٥‏/٢٠٢٦" [ref=e184] [cursor=pointer]:
                - cell "s salah ali" [ref=e185]:
                  - generic [ref=e186]:
                    - generic [ref=e187]: s
                    - generic [ref=e189]: salah ali
                - cell "حجة" [ref=e190]
                - cell "26 سنة" [ref=e191]
                - cell "تحت الكفالة" [ref=e192]:
                  - generic [ref=e193]: تحت الكفالة
                - cell "٠٢‏/٠٥‏/٢٠٢٦" [ref=e195]
              - row "1 111 إب 0 سنة تحت الكفالة ٢٥‏/٠٤‏/٢٠٢٦" [ref=e196] [cursor=pointer]:
                - cell "1 111" [ref=e197]:
                  - generic [ref=e198]:
                    - generic [ref=e199]: "1"
                    - generic [ref=e201]: "111"
                - cell "إب" [ref=e202]
                - cell "0 سنة" [ref=e203]
                - cell "تحت الكفالة" [ref=e204]:
                  - generic [ref=e205]: تحت الكفالة
                - cell "٢٥‏/٠٤‏/٢٠٢٦" [ref=e207]
        - generic [ref=e208]:
          - heading "إجراءات سريعة" [level=2] [ref=e210]
          - generic [ref=e211]:
            - button "تسجيل يتيم جديد ←" [ref=e212] [cursor=pointer]:
              - img [ref=e214]
              - generic [ref=e219]: تسجيل يتيم جديد
              - generic [ref=e220]: ←
            - button "تسجيل أسرة جديدة ←" [ref=e221] [cursor=pointer]:
              - img [ref=e223]
              - generic [ref=e226]: تسجيل أسرة جديدة
              - generic [ref=e227]: ←
            - button "رفع تقرير حفظ ←" [ref=e228] [cursor=pointer]:
              - img [ref=e230]
              - generic [ref=e232]: رفع تقرير حفظ
              - generic [ref=e233]: ←
            - button "رفع بصمات الصرف ←" [ref=e234] [cursor=pointer]:
              - img [ref=e236]
              - generic [ref=e245]: رفع بصمات الصرف
              - generic [ref=e246]: ←
            - button "عرض أيتامي ←" [ref=e247] [cursor=pointer]:
              - img [ref=e249]
              - generic [ref=e252]: عرض أيتامي
              - generic [ref=e253]: ←
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
> 10 |     await page.click('button:has-text("رفع تقرير جديد"), button:has-text("+ رفع")');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
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
  64 |     await expect(rejectBtn).toBeVisible({ timeout: 8000 });
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