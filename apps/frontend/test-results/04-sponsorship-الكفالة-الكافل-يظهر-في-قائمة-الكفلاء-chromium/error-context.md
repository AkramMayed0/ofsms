# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-sponsorship.spec.js >> الكفالة >> الكافل يظهر في قائمة الكفلاء
- Location: e2e\04-sponsorship.spec.js:25:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=كافل تجريبي 1779226412632')
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('text=كافل تجريبي 1779226412632')

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
          - textbox "ابحث بالاسم أو البريد أو رقم الهاتف…" [ref=e171]
        - generic [ref=e172]:
          - table [ref=e174]:
            - rowgroup [ref=e175]:
              - row "اسم الكافل رقم الهاتف البريد الإلكتروني الكفالات النشطة أنشأه تاريخ التسجيل" [ref=e176]:
                - columnheader "اسم الكافل" [ref=e177]
                - columnheader "رقم الهاتف" [ref=e178]
                - columnheader "البريد الإلكتروني" [ref=e179]
                - columnheader "الكفالات النشطة" [ref=e180]
                - columnheader "أنشأه" [ref=e181]
                - columnheader "تاريخ التسجيل" [ref=e182]
            - rowgroup [ref=e183]:
              - row "G GHOST — sponser2@ofsms.local 0 كفالة Realy? ١٨‏/٠٥‏/٢٠٢٦" [ref=e184] [cursor=pointer]:
                - cell "G GHOST" [ref=e185]:
                  - generic [ref=e186]:
                    - generic [ref=e187]: G
                    - generic [ref=e188]: GHOST
                - cell "—" [ref=e189]
                - cell "sponser2@ofsms.local" [ref=e190]
                - cell "0 كفالة" [ref=e191]:
                  - generic [ref=e192]: 0 كفالة
                - cell "Realy?" [ref=e193]
                - cell "١٨‏/٠٥‏/٢٠٢٦" [ref=e194]
              - row "T Test Sponsor — sponsor@ofsms.local 0 كفالة مدير النظام ١٨‏/٠٥‏/٢٠٢٦" [ref=e195] [cursor=pointer]:
                - cell "T Test Sponsor" [ref=e196]:
                  - generic [ref=e197]:
                    - generic [ref=e198]: T
                    - generic [ref=e199]: Test Sponsor
                - cell "—" [ref=e200]
                - cell "sponsor@ofsms.local" [ref=e201]
                - cell "0 كفالة" [ref=e202]:
                  - generic [ref=e203]: 0 كفالة
                - cell "مدير النظام" [ref=e204]
                - cell "١٨‏/٠٥‏/٢٠٢٦" [ref=e205]
              - row "y yousef algharasi 772722772 yousefyahya@gmail.com 3 كفالة مدير النظام ١٧‏/٠٥‏/٢٠٢٦" [ref=e206] [cursor=pointer]:
                - cell "y yousef algharasi" [ref=e207]:
                  - generic [ref=e208]:
                    - generic [ref=e209]: "y"
                    - generic [ref=e210]: yousef algharasi
                - cell "772722772" [ref=e211]
                - cell "yousefyahya@gmail.com" [ref=e212]
                - cell "3 كفالة" [ref=e213]:
                  - generic [ref=e214]: 3 كفالة
                - cell "مدير النظام" [ref=e215]
                - cell "١٧‏/٠٥‏/٢٠٢٦" [ref=e216]
              - row "ع علي خان +967772277232 alikan2000@gmail.com 0 كفالة مدير النظام ١٣‏/٠٥‏/٢٠٢٦" [ref=e217] [cursor=pointer]:
                - cell "ع علي خان" [ref=e218]:
                  - generic [ref=e219]:
                    - generic [ref=e220]: ع
                    - generic [ref=e221]: علي خان
                - cell "+967772277232" [ref=e222]
                - cell "alikan2000@gmail.com" [ref=e223]
                - cell "0 كفالة" [ref=e224]:
                  - generic [ref=e225]: 0 كفالة
                - cell "مدير النظام" [ref=e226]
                - cell "١٣‏/٠٥‏/٢٠٢٦" [ref=e227]
              - row "ع علي خان +967772277227 alikan1@gmail.com 0 كفالة مدير النظام ١٣‏/٠٥‏/٢٠٢٦" [ref=e228] [cursor=pointer]:
                - cell "ع علي خان" [ref=e229]:
                  - generic [ref=e230]:
                    - generic [ref=e231]: ع
                    - generic [ref=e232]: علي خان
                - cell "+967772277227" [ref=e233]
                - cell "alikan1@gmail.com" [ref=e234]
                - cell "0 كفالة" [ref=e235]:
                  - generic [ref=e236]: 0 كفالة
                - cell "مدير النظام" [ref=e237]
                - cell "١٣‏/٠٥‏/٢٠٢٦" [ref=e238]
              - row "ع علي خان — alikan@gmail.com 0 كفالة مدير النظام ١٣‏/٠٥‏/٢٠٢٦" [ref=e239] [cursor=pointer]:
                - cell "ع علي خان" [ref=e240]:
                  - generic [ref=e241]:
                    - generic [ref=e242]: ع
                    - generic [ref=e243]: علي خان
                - cell "—" [ref=e244]
                - cell "alikan@gmail.com" [ref=e245]
                - cell "0 كفالة" [ref=e246]:
                  - generic [ref=e247]: 0 كفالة
                - cell "مدير النظام" [ref=e248]
                - cell "١٣‏/٠٥‏/٢٠٢٦" [ref=e249]
              - row "y yousef +967772389234 yousef@gmail.com 1 كفالة مدير النظام ١٣‏/٠٥‏/٢٠٢٦" [ref=e250] [cursor=pointer]:
                - cell "y yousef" [ref=e251]:
                  - generic [ref=e252]:
                    - generic [ref=e253]: "y"
                    - generic [ref=e254]: yousef
                - cell "+967772389234" [ref=e255]
                - cell "yousef@gmail.com" [ref=e256]
                - cell "1 كفالة" [ref=e257]:
                  - generic [ref=e258]: 1 كفالة
                - cell "مدير النظام" [ref=e259]
                - cell "١٣‏/٠٥‏/٢٠٢٦" [ref=e260]
              - row "ا احمد علي صالح +967774299344 ahmed@gmail.com 0 كفالة مدير النظام ١٣‏/٠٥‏/٢٠٢٦" [ref=e261] [cursor=pointer]:
                - cell "ا احمد علي صالح" [ref=e262]:
                  - generic [ref=e263]:
                    - generic [ref=e264]: ا
                    - generic [ref=e265]: احمد علي صالح
                - cell "+967774299344" [ref=e266]
                - cell "ahmed@gmail.com" [ref=e267]
                - cell "0 كفالة" [ref=e268]:
                  - generic [ref=e269]: 0 كفالة
                - cell "مدير النظام" [ref=e270]
                - cell "١٣‏/٠٥‏/٢٠٢٦" [ref=e271]
              - row "s sjhbvdjsokjhbsk — — 1 كفالة مدير النظام ١٢‏/٠٥‏/٢٠٢٦" [ref=e272] [cursor=pointer]:
                - cell "s sjhbvdjsokjhbsk" [ref=e273]:
                  - generic [ref=e274]:
                    - generic [ref=e275]: s
                    - generic [ref=e276]: sjhbvdjsokjhbsk
                - cell "—" [ref=e277]
                - cell "—" [ref=e278]
                - cell "1 كفالة" [ref=e279]:
                  - generic [ref=e280]: 1 كفالة
                - cell "مدير النظام" [ref=e281]
                - cell "١٢‏/٠٥‏/٢٠٢٦" [ref=e282]
              - row "m mmmmmmmmmmmmmmm — — 0 كفالة مدير النظام ١٢‏/٠٥‏/٢٠٢٦" [ref=e283] [cursor=pointer]:
                - cell "m mmmmmmmmmmmmmmm" [ref=e284]:
                  - generic [ref=e285]:
                    - generic [ref=e286]: m
                    - generic [ref=e287]: mmmmmmmmmmmmmmm
                - cell "—" [ref=e288]
                - cell "—" [ref=e289]
                - cell "0 كفالة" [ref=e290]:
                  - generic [ref=e291]: 0 كفالة
                - cell "مدير النظام" [ref=e292]
                - cell "١٢‏/٠٥‏/٢٠٢٦" [ref=e293]
              - row "m mmmmmmmmmmmmmmmm — supervisor@ofsms.loca 0 كفالة مدير النظام ١٢‏/٠٥‏/٢٠٢٦" [ref=e294] [cursor=pointer]:
                - cell "m mmmmmmmmmmmmmmmm" [ref=e295]:
                  - generic [ref=e296]:
                    - generic [ref=e297]: m
                    - generic [ref=e298]: mmmmmmmmmmmmmmmm
                - cell "—" [ref=e299]
                - cell "supervisor@ofsms.loca" [ref=e300]
                - cell "0 كفالة" [ref=e301]:
                  - generic [ref=e302]: 0 كفالة
                - cell "مدير النظام" [ref=e303]
                - cell "١٢‏/٠٥‏/٢٠٢٦" [ref=e304]
              - row "b bbbbb — supervisor@ofsms.local 0 كفالة مدير النظام ١٢‏/٠٥‏/٢٠٢٦" [ref=e305] [cursor=pointer]:
                - cell "b bbbbb" [ref=e306]:
                  - generic [ref=e307]:
                    - generic [ref=e308]: b
                    - generic [ref=e309]: bbbbb
                - cell "—" [ref=e310]
                - cell "supervisor@ofsms.local" [ref=e311]
                - cell "0 كفالة" [ref=e312]:
                  - generic [ref=e313]: 0 كفالة
                - cell "مدير النظام" [ref=e314]
                - cell "١٢‏/٠٥‏/٢٠٢٦" [ref=e315]
              - row "a ali 77791981 yousefalgharasi@gmail.com 0 كفالة مدير النظام ١٢‏/٠٥‏/٢٠٢٦" [ref=e316] [cursor=pointer]:
                - cell "a ali" [ref=e317]:
                  - generic [ref=e318]:
                    - generic [ref=e319]: a
                    - generic [ref=e320]: ali
                - cell "77791981" [ref=e321]
                - cell "yousefalgharasi@gmail.com" [ref=e322]
                - cell "0 كفالة" [ref=e323]:
                  - generic [ref=e324]: 0 كفالة
                - cell "مدير النظام" [ref=e325]
                - cell "١٢‏/٠٥‏/٢٠٢٦" [ref=e326]
              - row "a ali 777919815 yousefalgharasi1@gmail.com 2 كفالة مدير النظام ٠١‏/٠٥‏/٢٠٢٦" [ref=e327] [cursor=pointer]:
                - cell "a ali" [ref=e328]:
                  - generic [ref=e329]:
                    - generic [ref=e330]: a
                    - generic [ref=e331]: ali
                - cell "777919815" [ref=e332]
                - cell "yousefalgharasi1@gmail.com" [ref=e333]
                - cell "2 كفالة" [ref=e334]:
                  - generic [ref=e335]: 2 كفالة
                - cell "مدير النظام" [ref=e336]
                - cell "٠١‏/٠٥‏/٢٠٢٦" [ref=e337]
              - row "م محمج الحادا 444511555 amin@ofsms.local 0 كفالة Realy? ٠١‏/٠٥‏/٢٠٢٦" [ref=e338] [cursor=pointer]:
                - cell "م محمج الحادا" [ref=e339]:
                  - generic [ref=e340]:
                    - generic [ref=e341]: م
                    - generic [ref=e342]: محمج الحادا
                - cell "444511555" [ref=e343]
                - cell "amin@ofsms.local" [ref=e344]
                - cell "0 كفالة" [ref=e345]:
                  - generic [ref=e346]: 0 كفالة
                - cell "Realy?" [ref=e347]
                - cell "٠١‏/٠٥‏/٢٠٢٦" [ref=e348]
              - row "ك كافل تجريبي +967700000001 sponsor@test.local 2 كفالة مدير النظام ٢٥‏/٠٤‏/٢٠٢٦" [ref=e349] [cursor=pointer]:
                - cell "ك كافل تجريبي" [ref=e350]:
                  - generic [ref=e351]:
                    - generic [ref=e352]: ك
                    - generic [ref=e353]: كافل تجريبي
                - cell "+967700000001" [ref=e354]
                - cell "sponsor@test.local" [ref=e355]
                - cell "2 كفالة" [ref=e356]:
                  - generic [ref=e357]: 2 كفالة
                - cell "مدير النظام" [ref=e358]
                - cell "٢٥‏/٠٤‏/٢٠٢٦" [ref=e359]
              - row "? ???? ?????? +967700123456 ahmed@example.com 0 كفالة مدير النظام ٢٤‏/٠٤‏/٢٠٢٦" [ref=e360] [cursor=pointer]:
                - cell "? ???? ??????" [ref=e361]:
                  - generic [ref=e362]:
                    - generic [ref=e363]: "?"
                    - generic [ref=e364]: "???? ??????"
                - cell "+967700123456" [ref=e365]
                - cell "ahmed@example.com" [ref=e366]
                - cell "0 كفالة" [ref=e367]:
                  - generic [ref=e368]: 0 كفالة
                - cell "مدير النظام" [ref=e369]
                - cell "٢٤‏/٠٤‏/٢٠٢٦" [ref=e370]
          - generic [ref=e371]: عرض 17 من 17 كافل
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
  18 |     await page.click('button[type="submit"], button:has-text("حفظ"), button:has-text("إضافة")');
  19 | 
  20 |     await expect(
  21 |       page.locator('text=تم إضافة, text=بنجاح').first()
  22 |     ).toBeVisible({ timeout: 8000 });
  23 |   });
  24 | 
  25 |   test('الكافل يظهر في قائمة الكفلاء', async ({ page }) => {
  26 |     await login(page, 'gm');
  27 |     await page.goto('/sponsors');
> 28 |     await expect(page.locator(`text=${sponsorName}`)).toBeVisible({ timeout: 8000 });
     |                                                       ^ Error: expect(locator).toBeVisible() failed
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