# OFSMS — Deployment readiness checklist

Result of the pre-delivery audit. Items marked **TODO (you)** need a decision or an action on the live
servers; everything else was fixed in the code.

## Fixed in the code

| Problem | Impact | Fix |
|---|---|---|
| Supervisor menu link `/disbursements/` had a trailing slash | Supervisor was bounced to the dashboard and could never open the disbursement page | Link corrected |
| Quran reports page called routes that do not exist (`GET /quran-reports`, `PATCH /:id/approve`, `/:id/reject`) | Supervisor/GM could not see or review reports; agent list also 404 | Page now uses `/pending`, `/mine` and `PATCH /:id/review` |
| `DELETE /api/families/:id` did not exist | "Delete family" button always failed | Route added (GM only, blocked if an active sponsorship or past disbursement exists) |
| `POST /api/notifications/test/trigger-cron` allowed any logged-in user | Any employee could trigger the monthly job | Restricted to GM |
| No limit on login attempts | Password guessing | 20 attempts / 15 min / IP on staff and sponsor login |
| API URL forced to `http://<host>:4000` on any non-localhost host | Deployed site / Android app could not reach the API | `NEXT_PUBLIC_API_URL` is now used whenever it is set |
| `seed.js` wipes all tables and creates `Test@1234` users | Could destroy production data | Refuses to run when `NODE_ENV=production` |
| `migrate.js` forced SSL | Could not migrate a local database | SSL only for non-local databases |
| `disbursement-flow.test.js` used wrong users and old routes; `jest` tried to run it | Test suite red | Script updated, jest ignores `scripts/` |
| No `.env.example` files | New deployments guess variables | Added for backend and frontend |
| Landing footer linked to the admin page and to a demo sponsor token | Public site exposed a test link | Replaced by sponsor login and the user guide |

## TODO (you) before handing over to the client

1. **Set environment variables** (see `apps/backend/.env.example`, `apps/frontend/.env.example`):
   - Backend (Render): `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
     `JWT_SPONSOR_SECRET` (long random, all different), `FRONTEND_URL` (exact Vercel URL),
     S3 and Firebase keys.
   - Frontend (Vercel): `NEXT_PUBLIC_API_URL=https://<backend>/api`. Redeploy after changing it.
2. **Never run `npm run seed` on the live database.** Create real users from *إدارة المستخدمين*
   (or with `scripts/create-test-user.js` once, then change its password).
3. **Remove/replace demo accounts** (`*@ofsms.local`, `sponsor@test.local`, password `Test@1234`) on the
   live database. Check with: `SELECT email FROM users WHERE email LIKE '%@ofsms.local';`
4. **Plain-text sponsor passwords.** Migration 021 added `sponsors.portal_password_plain` so the GM can
   re-send a sponsor's password. This is a security risk if the database leaks. Decision for you:
   keep it (convenient) or switch to "reset password and show it once". It was *not* removed
   because the GM screens depend on it.
5. **Supabase specifics.** Migration `016_create_ads.sql` uses Supabase-only objects (`authenticated`
   role, `auth.jwt()`); it works on Supabase but fails on plain PostgreSQL.
6. **Backups.** Turn on automatic backups for the production database.
7. **Housekeeping (not deleted, your call):** `cookies.txt` (empty curl cookie jar),
   `apps/backend/scratch/*` and `apps/frontend/scratch/*` (one-off helper scripts that contain the test
   password), `apps/frontend/playwright-report`, `test-results`, and the `test-*.pdf/xlsx` files in
   `apps/frontend/public`. They do no harm but should not ship to a client repository.
8. **Android app**: after the backend URL is final, run *Actions → Build Android APK* with the
   production site URL. The CORS list already allows the site origin through `FRONTEND_URL`.

## How it was tested

* Fresh PostgreSQL 16: all 23 migrations + seed data.
* API: every GET endpoint as GM / supervisor / agent / finance / anonymous — no 5xx, roles see only
  what they should.
* Full monthly flow (agent report → supervisor approval → list → supervisor → finance → GM release):
  16/16 steps pass.
* Browser tests with real data for each staff role (all main pages load without script errors),
  supervisor Quran approval from the UI, dark mode on all pages, login rate limit.
* Frontend production build passes.

## Known, not changed

* ESLint reports pre-existing warnings (unused imports) and errors in the jest test file (missing `jest`
  environment). They do not affect the build.
* Disbursement inclusion rule: an orphan with a *pending* or *rejected* Quran report for the month is
  excluded from the list (with the reason). Orphans with no report are included.
