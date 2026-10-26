# Deploying OFSMS on Railway

Same steps for **your own account (test)** and later for **the client's account**. Nothing in the
code is tied to an account: everything is driven by variables, so moving = repeat the steps
(≈ 15 minutes) and optionally copy the data.

## Why Railway (and what it costs)

| | Railway (all-in-one) | Render + Vercel |
|---|---|---|
| Accounts to hand over | **1** | 2–3 |
| Database | Postgres in the same project, private network | external (Supabase/Render) |
| Sleeps when idle | No | Free tiers sleep / free DB expires |
| Price | Pay-as-you-go; trial credit, then about $5/month plan with usage included (check railway.com/pricing) | Free tiers, but with the limits above |

For a client system that must always answer, one Railway project (database + API + website) is the
simplest thing to hand over. Expect a few dollars per month for this size.

## What the repo already contains

* `apps/backend/Dockerfile` + `railway.json` — API image with Chromium and Arabic fonts (PDF reports).
  Before every deploy it runs `npm run predeploy` = database migrations + first-admin creation.
* `apps/frontend/Dockerfile` + `railway.json` — the Next.js website.
* Tested locally: image build, migrations on an empty PostgreSQL, admin creation, login, CORS,
  Arabic PDF, website pages.

## Part 1 — Your own Railway account

### 1. Push the code to GitHub
Railway deploys from the GitHub repository (`AkramMayed0/ofsms`, branch `main`).

### 2. Create the project and database
1. Railway → **New Project → Deploy PostgreSQL**. Keep the service name **Postgres**.

### 3. Backend service
1. In the project: **New → GitHub Repo → ofsms**. Rename the service to **backend**.
2. **Settings → Source → Root Directory** = `apps/backend`. (Railway picks up `Dockerfile` and `railway.json`.)
3. **Variables** (use the *Raw editor* and paste, then change the 4 marked values):

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
PORT=4000
JWT_SECRET=<random, 64+ chars>          # openssl rand -hex 48
JWT_REFRESH_SECRET=<another random>
JWT_SPONSOR_SECRET=<another random>
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
PUBLIC_API_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
ADMIN_EMAIL=<your email>                # first General Manager account
ADMIN_PASSWORD=<at least 10 characters>
ADMIN_NAME=مدير النظام
UPLOADS_DIR=/data/uploads
STORAGE_DRIVER=local
```
   * Do **not** set `FORCE_HTTPS` (Railway's health check uses plain HTTP and would be redirected).
   * Firebase (`FIREBASE_*`) is only needed for push notifications; skip it while testing.
4. **Settings → Networking → Generate Domain** (target port 4000).
5. **Settings → Volumes → New Volume**, mount path `/data`. Without it uploaded documents disappear
   on every redeploy. (For production with the client prefer S3-compatible storage; see "Files" below.)

### 4. Frontend service
1. **New → GitHub Repo → ofsms** again. Rename it **frontend**.
2. **Root Directory** = `apps/frontend`.
3. **Variables**:
```
NEXT_PUBLIC_API_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}/api
```
4. **Generate Domain** (target port 3000 — Railway usually detects it).
   If you rename a service or change a variable that starts with `NEXT_PUBLIC_`, redeploy the frontend:
   those values are baked in at build time.

### 5. First login
Open the frontend domain → **تسجيل الدخول** with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
Then **remove `ADMIN_PASSWORD` from the backend variables** (it is only needed once).
The built-in `admin@ofsms.local` account is disabled automatically (migration 024).
Create the other users from **إدارة المستخدمين**.

### 6. Checks
* `https://<backend-domain>/health` → `{"status":"ok"}`
* Login works and survives a page refresh.
* A PDF report downloads with Arabic text.
* Upload a document, redeploy the backend, confirm the file is still there (proves the Volume).

### 7. Android app
GitHub → **Actions → Build Android APK → Run workflow**, `site_url` = the frontend domain.

## Part 2 — The client's Railway account

Pick one:

**A. Transfer the project** (keeps everything). Railway project settings let you transfer a project
to another workspace (check *Project Settings → Danger/Transfer*). The client must first create a
workspace/account and add a payment method. Domains stay `*.up.railway.app` names of the same services.

**B. Recreate (cleanest).** Repeat Part 1 in their account, connecting *their* GitHub access to the repo
(or fork/transfer the repo to them). Then copy data if the test data should be kept:
```
# dump from your project (Postgres service → Connect → "Public network" URL)
pg_dump "<YOUR_DATABASE_PUBLIC_URL>" --no-owner --no-acl -Fc -f ofsms.dump
# restore into theirs, AFTER their backend has run once so the schema exists, or into an empty DB
pg_restore --no-owner --no-acl --clean --if-exists -d "<CLIENT_DATABASE_PUBLIC_URL>" ofsms.dump
```
Skip the restore to start the client with an empty system (recommended: no test data).

**Use a custom domain so nothing changes for users.** Point `app.client-domain.org` (frontend) and
`api.client-domain.org` (backend) at the Railway services (Settings → Networking → Custom Domain).
Then set `FRONTEND_URL=https://app.client-domain.org`, `PUBLIC_API_URL=https://api.client-domain.org`,
`NEXT_PUBLIC_API_URL=https://api.client-domain.org/api`. Moving between Railway accounts later is
then only a DNS change, and the Android app (built with the custom domain) keeps working.

## Files (documents, fingerprints)
* **Test:** Volume at `/data` + `UPLOADS_DIR=/data/uploads` (above).
* **Production:** use S3-compatible storage (AWS S3, Cloudflare R2, Backblaze...). Set
  `S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` and, for non-AWS,
  `S3_ENDPOINT`; remove `STORAGE_DRIVER`/`UPLOADS_DIR`. Files are not copied automatically
  between storage systems.

## Troubleshooting
| Symptom | Cause / fix |
|---|---|
| "Not allowed by CORS" at login | `FRONTEND_URL` on the backend does not match the website address exactly. |
| Login works, then you are logged out on refresh | `NODE_ENV` must be `production` on the backend (cookie `SameSite=None; Secure`). |
| Website calls `http://...:4000` | `NEXT_PUBLIC_API_URL` was not set at build time. Set it and redeploy the frontend. |
| Backend deploy fails at "pre-deploy" | Read its log: usually `DATABASE_URL` reference (`${{Postgres.DATABASE_URL}}`) or a wrong service name. |
| Backend health check fails | `PORT` must be `4000` and the domain's target port 4000; do not set `FORCE_HTTPS`. |
| PDF reports fail | Check the backend memory (Chromium needs ~500 MB). |
| Images/documents do not show | `PUBLIC_API_URL` missing (local storage) or no Volume. |
