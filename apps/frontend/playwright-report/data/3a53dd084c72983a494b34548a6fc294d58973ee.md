# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: registration.spec.js >> E2E Registration Flow >> Agent registers orphan, Supervisor approves, GM sees in Marketing
- Location: e2e\registration.spec.js:21:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1:has-text("لوحة المندوب")')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('h1:has-text("لوحة المندوب")')

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
  1   | const { test, expect } = require('@playwright/test');
  2   | const fs = require('fs');
  3   | const path = require('path');
  4   | 
  5   | test.describe('E2E Registration Flow', () => {
  6   |   const dummyPdfPath = path.join(__dirname, 'dummy.pdf');
  7   |   const uniqueOrphanName = `E2E Orphan ${Date.now()}`;
  8   | 
  9   |   test.beforeAll(() => {
  10  |     // Create a dummy PDF that passes the magic byte scanner (%PDF)
  11  |     fs.writeFileSync(dummyPdfPath, Buffer.from('255044460A', 'hex'));
  12  |   });
  13  | 
  14  |   test.afterAll(() => {
  15  |     // Cleanup
  16  |     if (fs.existsSync(dummyPdfPath)) {
  17  |       fs.unlinkSync(dummyPdfPath);
  18  |     }
  19  |   });
  20  | 
  21  |   test('Agent registers orphan, Supervisor approves, GM sees in Marketing', async ({ browser }) => {
  22  |     // We use isolated contexts for different roles
  23  |     const agentContext = await browser.newContext();
  24  |     const supervisorContext = await browser.newContext();
  25  | 
  26  |     // ── 1. Agent logs in & Submits Registration ──
  27  |     const agentPage = await agentContext.newPage();
  28  |     await agentPage.goto('/login');
  29  |     
  30  |     // Fill login form (assuming standard dummy accounts from create-test-accounts)
  31  |     await agentPage.fill('input[type="email"]', 'agent@ofsms.local');
  32  |     await agentPage.fill('input[type="password"]', 'Test@1234');
  33  |     await agentPage.click('button:has-text("تسجيل الدخول")');
  34  |     
  35  |     // Ensure dashboard loads
> 36  |     await expect(agentPage.locator('h1:has-text("لوحة المندوب")')).toBeVisible({ timeout: 10000 });
      |                                                                    ^ Error: expect(locator).toBeVisible() failed
  37  | 
  38  |     // Navigate to new orphan page
  39  |     await agentPage.goto('/orphans/new');
  40  |     await expect(agentPage.locator('h1:has-text("تسجيل يتيم جديد")')).toBeVisible();
  41  | 
  42  |     // Fill out registration form
  43  |     await agentPage.fill('input[name="fullName"]', uniqueOrphanName);
  44  |     // Fill dob
  45  |     await agentPage.fill('input[name="dateOfBirth"]', '2015-01-01');
  46  |     // Select gender
  47  |     await agentPage.selectOption('select[name="gender"]', 'male');
  48  |     // Select governorate (assuming 1 is valid)
  49  |     await agentPage.selectOption('select[name="governorateId"]', '1');
  50  |     
  51  |     // Guardian details
  52  |     await agentPage.fill('input[name="guardianName"]', 'Guardian of ' + uniqueOrphanName);
  53  |     await agentPage.selectOption('select[name="guardianRelation"]', 'uncle');
  54  |     
  55  |     // Upload files
  56  |     await agentPage.setInputFiles('input[name="deathCert"]', dummyPdfPath);
  57  |     await agentPage.setInputFiles('input[name="birthCert"]', dummyPdfPath);
  58  |     
  59  |     // Submit form
  60  |     await agentPage.click('button:has-text("حفظ")');
  61  | 
  62  |     // Should redirect or show success
  63  |     await expect(agentPage.locator('text=تم تسجيل اليتيم بنجاح')).toBeVisible({ timeout: 10000 });
  64  |     
  65  |     // Close agent context
  66  |     await agentContext.close();
  67  | 
  68  |     // ── 2. Supervisor logs in & Approves ──
  69  |     const supervisorPage = await supervisorContext.newPage();
  70  |     await supervisorPage.goto('/login');
  71  |     await supervisorPage.fill('input[type="email"]', 'supervisor@ofsms.local');
  72  |     await supervisorPage.fill('input[type="password"]', 'Test@1234');
  73  |     await supervisorPage.click('button:has-text("تسجيل الدخول")');
  74  |     
  75  |     // Go to unapproved orphans list (often main dashboard or specific list)
  76  |     // Here we can go directly to the orphan's page or search for them
  77  |     await supervisorPage.goto('/orphans'); // Assuming there's a master list
  78  |     
  79  |     // Find the specific orphan
  80  |     await expect(supervisorPage.locator(`text=${uniqueOrphanName}`)).toBeVisible({ timeout: 10000 });
  81  |     
  82  |     // Click on the orphan to view details (assuming there's a link)
  83  |     await supervisorPage.click(`a:has-text("${uniqueOrphanName}")`);
  84  | 
  85  |     // Click "تعديل الحالة" (Change Status)
  86  |     await supervisorPage.click('button:has-text("تغيير الحالة")');
  87  |     
  88  |     // Select "under_marketing"
  89  |     await supervisorPage.selectOption('select[name="status"]', 'under_marketing');
  90  |     await supervisorPage.click('button:has-text("حفظ الحالة")');
  91  | 
  92  |     await expect(supervisorPage.locator('text=تم تحديث الحالة بنجاح')).toBeVisible();
  93  | 
  94  |     // ── 3. Verify in Marketing Pool ──
  95  |     // The supervisor or GM can see the marketing pool
  96  |     await supervisorPage.goto('/marketing-pool');
  97  |     await expect(supervisorPage.locator(`text=${uniqueOrphanName}`)).toBeVisible();
  98  | 
  99  |     await supervisorContext.close();
  100 |   });
  101 | });
  102 | 
```