# E2E Tests — نظام إدارة الأيتام والأسر

## المتطلبات
- السيرفر الأمامي شغال على `http://localhost:3000`
- السيرفر الخلفي شغال على `http://localhost:5000` (أو حسب الإعداد)
- حسابات تجريبية موجودة في قاعدة البيانات:
  | الدور | الإيميل | الباسورد |
  |-------|---------|---------|
  | GM | gm@test.com | Password123! |
  | مشرف | supervisor@test.com | Password123! |
  | مندوب | agent@test.com | Password123! |

## التشغيل

```bash
cd apps/frontend

# تشغيل كل الاختبارات
npm run test:e2e

# تشغيل ملف محدد
npx playwright test e2e/01-auth.spec.js

# تشغيل مع واجهة بصرية
npx playwright test --headed

# فتح تقرير النتائج
npx playwright show-report
```

## الاختبارات

| الملف | ما يختبره |
|-------|-----------|
| `01-auth.spec.js` | تسجيل الدخول، الصلاحيات، localStorage |
| `02-orphan-registration.spec.js` | تسجيل يتيم → موافقة مشرف → قائمة التسويق |
| `03-quran-reports.spec.js` | رفع تقرير → موافقة/رفض المشرف |
| `04-sponsorship.spec.js` | إضافة كافل → تعيين مستفيد |
