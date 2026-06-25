const { chromium } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/api';
const CHROME_EXE = process.env.CHROME_EXE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PASSWORD = 'Test@1234';

const accounts = {
  gm: { email: 'gm@ofsms.local', password: PASSWORD },
  supervisor: { email: 'supervisor@ofsms.local', password: PASSWORD },
  agent: { email: 'agent@ofsms.local', password: PASSWORD },
};

const gmRoutes = [
  '/',
  '/login',
  '/dashboard',
  '/ads',
  '/announcements',
  '/disbursements',
  '/disbursements/history',
  '/families',
  '/families/new',
  '/governorates',
  '/marketing-pool',
  '/my-orphans',
  '/orphans',
  '/orphans/gifted',
  '/orphans/new',
  '/quran-reports',
  '/quran-reports/new',
  '/quran-thresholds',
  '/receipts/supervisor',
  '/registrations',
  '/reports',
  '/sponsors',
  '/users',
];

const supervisorRoutes = [
  '/dashboard',
  '/registrations',
  '/quran-reports',
  '/disbursements',
  '/reports',
  '/announcements',
];

const agentRoutes = [
  '/dashboard',
  '/my-orphans',
  '/orphans/new',
  '/families/new',
  '/quran-reports/new',
  '/receipts/batch',
  '/announcements',
];

const publicRoutes = [
  '/sponsor/login',
  '/sponsor/portal',
];

async function login(page, role) {
  const account = accounts[role];
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

async function checkRoute(page, route, expectedRole = 'public') {
  const issues = [];
  const onConsole = (msg) => {
    if (msg.type() === 'error') issues.push(`console error: ${msg.text()}`);
  };
  const onPageError = (err) => issues.push(`page error: ${err.message}`);
  const onResponse = (res) => {
    if (res.status() >= 500) issues.push(`HTTP ${res.status()}: ${res.url()}`);
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('response', onResponse);

  let status = 'ok';
  let finalUrl = '';
  let heading = '';

  try {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
    finalUrl = page.url();
    heading = await page.locator('h1, h2').first().textContent({ timeout: 3000 }).catch(() => '');
    const nextErrorVisible = await page
      .locator('nextjs-portal, [data-nextjs-dialog], text="Application error", text="Unhandled Runtime Error", text="This page could not be found"')
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (response && response.status() >= 400) {
      issues.push(`document HTTP ${response.status()}`);
    }
    if (nextErrorVisible) {
      issues.push('visible error page text');
    }
    if (route !== '/login' && expectedRole !== 'public' && finalUrl.includes('/login')) {
      issues.push('unexpected redirect to login');
    }
    if (issues.length) status = 'fail';
  } catch (err) {
    status = 'fail';
    issues.push(err.message);
  } finally {
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    page.off('response', onResponse);
  }

  return { route, status, finalUrl, heading: (heading || '').trim(), issues };
}

async function dynamicRoutes(page) {
  const token = await page.evaluate(() => localStorage.getItem('ofsms_user') && window.__OFSMS_TOKEN__);
  const results = [];

  async function apiGet(path) {
    return page.evaluate(
      async ({ url }) => {
        const store = window.localStorage.getItem('ofsms_user');
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return null;
        return res.json();
      },
      { url: `${API_URL}${path}` }
    );
  }

  try {
    const orphans = await apiGet('/orphans');
    const orphan = (orphans?.data || orphans || [])[0];
    if (orphan?.id) {
      results.push(`/orphans/${orphan.id}`);
      results.push(`/orphans/${orphan.id}/edit`);
    }
  } catch {}

  try {
    const families = await apiGet('/families');
    const family = (families?.data || families || [])[0];
    if (family?.id) {
      results.push(`/families/${family.id}`);
      results.push(`/families/${family.id}/edit`);
    }
  } catch {}

  try {
    const sponsors = await apiGet('/sponsors');
    const sponsor = (sponsors?.data || sponsors || [])[0];
    if (sponsor?.id) results.push(`/sponsors/${sponsor.id}`);
  } catch {}

  try {
    const disbursements = await apiGet('/disbursements');
    const disbursement = (disbursements?.data || disbursements || [])[0];
    if (disbursement?.id) results.push(`/disbursements/${disbursement.id}`);
  } catch {}

  return [...new Set(results)];
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME_EXE, headless: true });
  const results = [];

  for (const route of publicRoutes) {
    const context = await browser.newContext({ locale: 'ar-YE' });
    const page = await context.newPage();
    results.push(await checkRoute(page, route, 'public'));
    await context.close();
  }

  for (const [role, routes] of Object.entries({ gm: gmRoutes, supervisor: supervisorRoutes, agent: agentRoutes })) {
    const context = await browser.newContext({ locale: 'ar-YE' });
    const page = await context.newPage();
    await login(page, role);
    const roleRoutes = role === 'gm' ? [...routes, ...(await dynamicRoutes(page))] : routes;
    for (const route of roleRoutes) {
      results.push({ role, ...(await checkRoute(page, route, role)) });
    }
    await context.close();
  }

  await browser.close();
  const failed = results.filter((r) => r.status === 'fail');
  console.log(JSON.stringify({ total: results.length, failed: failed.length, results }, null, 2));
  if (failed.length) process.exit(1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
