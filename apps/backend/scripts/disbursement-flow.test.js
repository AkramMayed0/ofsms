/**
 * disbursement-flow.test.js
 * Task: feature/e2e-disbursement-flow
 *
 * End-to-end integration test covering the full monthly disbursement cycle:
 *
 * 1. Agent submits Quran report for an orphan
 * 2. Supervisor approves the Quran report
 * 3. Supervisor generates the monthly disbursement list
 * 4. Supervisor approves the disbursement list
 * 5. Finance authorizes the disbursement list
 * 6. GM releases the funds
 *
 * Requires: running backend at TEST_API_URL (defaults to http://localhost:4000/api)
 * Run with: node disbursement-flow.test.js
 *
 * Uses only Node.js built-ins + node-fetch (already a dep via firebase-admin).
 * No external test framework required.
 */

'use strict';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:4000/api';

// ── ANSI colors for output ─────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE   = '\x1b[34m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

let passed = 0;
let failed = 0;

// ── Minimal HTTP client ────────────────────────────────────────────────────────

async function request(method, path, body, token) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }

  return { status: res.status, data };
}

const get   = (path, token)        => request('GET',   path, null,  token);
const post  = (path, body, token)  => request('POST',  path, body,  token);
const patch = (path, body, token)  => request('PATCH', path, body,  token);

// ── Test helpers ───────────────────────────────────────────────────────────────

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function step(name, fn) {
  process.stdout.write(`  ${BLUE}▶${RESET}  ${name}… `);
  try {
    const result = await fn();
    console.log(`${GREEN}✅ PASS${RESET}`);
    passed++;
    return result;
  } catch (err) {
    console.log(`${RED}❌ FAIL${RESET}`);
    console.log(`     ${RED}${err.message}${RESET}`);
    failed++;
    throw err; // Stop on first failure
  }
}

// ── Login helper ───────────────────────────────────────────────────────────────

async function login(email, password) {
  const { status, data } = await post('/auth/login', { email, password });
  assert(status === 200, `Login failed for ${email}: ${data?.error || status}`);
  assert(data.accessToken, 'No access token returned');
  return data.accessToken;
}

// ── Main test suite ────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n${BOLD}${BLUE}═══════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  OFSMS — E2E Disbursement Flow Test${RESET}`);
  console.log(`${BOLD}${BLUE}═══════════════════════════════════════════════${RESET}\n`);
  console.log(`${YELLOW}  API:${RESET} ${BASE_URL}\n`);

  // ── Credentials (use your test accounts) ────────────────────────────────────
  const AGENT_EMAIL      = process.env.AGENT_EMAIL      || 'agent@ofsms.local';
  const AGENT_PASSWORD   = process.env.AGENT_PASSWORD   || 'Test@1234';
  const SUP_EMAIL        = process.env.SUP_EMAIL        || 'supervisor@ofsms.local';
  const SUP_PASSWORD     = process.env.SUP_PASSWORD     || 'Test@1234';
  const FINANCE_EMAIL    = process.env.FINANCE_EMAIL    || 'finance@ofsms.local';
  const FINANCE_PASSWORD = process.env.FINANCE_PASSWORD || 'Test@1234';
  const GM_EMAIL         = process.env.GM_EMAIL         || 'admin@ofsms.local';
  const GM_PASSWORD      = process.env.GM_PASSWORD      || 'Admin@1234';

  let agentToken, supToken, finToken, gmToken;
  let orphanId, reportId, listId;

  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  try {
    // ── Phase 1: Authentication ────────────────────────────────────────────────
    console.log(`${BOLD}Phase 1: Authentication${RESET}`);

    agentToken = await step('Login as Agent',    () => login(AGENT_EMAIL,      AGENT_PASSWORD));
    supToken   = await step('Login as Supervisor', () => login(SUP_EMAIL,      SUP_PASSWORD));
    finToken   = await step('Login as Finance',  () => login(FINANCE_EMAIL,    FINANCE_PASSWORD));
    gmToken    = await step('Login as GM',       () => login(GM_EMAIL,         GM_PASSWORD));

    // ── Phase 2: Resolve an active orphan for the agent ───────────────────────
    console.log(`\n${BOLD}Phase 2: Resolve Test Orphan${RESET}`);

    orphanId = await step('Find agent orphan under sponsorship', async () => {
      const { status, data } = await get('/orphans?status=under_sponsorship', agentToken);
      assert(status === 200, `GET /orphans failed: ${status}`);
      assert(data.orphans?.length > 0,
        'No orphans under sponsorship found for this agent. Register and sponsor an orphan first.');
      orphanId = data.orphans[0].id;
      return orphanId;
    });

    // ── Phase 3: Agent submits Quran report ───────────────────────────────────
    console.log(`\n${BOLD}Phase 3: Agent Submits Quran Report${RESET}`);

    reportId = await step(`Submit Quran report (${month}/${year})`, async () => {
      const { status, data } = await post('/quran-reports', {
        orphanId, month, year, juzMemorized: 1.5,
      }, agentToken);

      // 409 = already submitted this month — fetch existing
      if (status === 409) {
        const { data: listData } = await get(
          `/quran-reports?month=${month}&year=${year}`, agentToken
        );
        const existing = listData.reports?.find(
          r => r.orphan_id === orphanId && r.month === month && r.year === year
        );
        assert(existing, 'Could not find existing report for this month');
        return existing.id;
      }

      assert(status === 201, `Submit report failed: ${data?.error || status}`);
      assert(data.report?.id, 'No report ID returned');
      return data.report.id;
    });

    // ── Phase 4: Supervisor approves Quran report ─────────────────────────────
    console.log(`\n${BOLD}Phase 4: Supervisor Approves Quran Report${RESET}`);

    await step('Supervisor approves Quran report', async () => {
      const { status, data } = await patch(`/quran-reports/${reportId}/approve`, {}, supToken);
      // 400 = already approved — that's fine
      if (status === 400 && data?.error?.includes('مراجعته')) return;
      assert(status === 200, `Approve report failed: ${data?.error || status}`);
      assert(data.report?.status === 'approved', `Report status is ${data.report?.status}`);
    });

    await step('Verify report status is approved', async () => {
      const { status, data } = await get(`/quran-reports/${reportId}`, supToken);
      assert(status === 200, `GET report failed: ${status}`);
      assert(
        data.report?.status === 'approved',
        `Expected 'approved', got '${data.report?.status}'`
      );
    });

    // ── Phase 5: Generate disbursement list ───────────────────────────────────
    console.log(`\n${BOLD}Phase 5: Generate Disbursement List${RESET}`);

    listId = await step(`Generate disbursement list for ${month}/${year}`, async () => {
      const { status, data } = await post('/disbursements/generate', {}, supToken);

      // 409 = list already exists this month
      if (status === 409) {
        const { data: lists } = await get('/disbursements', supToken);
        const existing = lists.lists?.find(
          l => l.month === month && l.year === year
        );
        assert(existing, 'Could not find existing list for this month');
        return existing.id;
      }

      assert(status === 201, `Generate list failed: ${data?.error || status}`);
      assert(data.id, 'No list ID returned');
      return data.id;
    });

    await step('Verify list exists with items', async () => {
      const { status, data } = await get(`/disbursements/${listId}`, supToken);
      assert(status === 200, `GET disbursement failed: ${status}`);
      assert(data.items?.length > 0, 'Disbursement list has no items');
      console.log(`\n     ${YELLOW}→ ${data.items.length} items · included: ${
        data.items.filter(i => i.included).length
      } · excluded: ${
        data.items.filter(i => !i.included).length
      }${RESET}`);
    });

    // ── Phase 6: Supervisor approves disbursement list ────────────────────────
    console.log(`\n${BOLD}Phase 6: Supervisor Approves Disbursement List${RESET}`);

    await step('Supervisor approves disbursement list', async () => {
      const { status, data } = await patch(`/disbursements/${listId}/approve`, {}, supToken);
      if (status === 400 && data?.error?.includes('الحالة')) return; // already approved
      assert(status === 200, `Supervisor approve failed: ${data?.error || status}`);
    });

    await step('Verify list status is supervisor_approved', async () => {
      const { status, data } = await get(`/disbursements/${listId}`, supToken);
      assert(status === 200, `GET disbursement failed: ${status}`);
      assert(
        ['supervisor_approved','finance_approved','released'].includes(data.status),
        `Expected supervisor_approved+, got '${data.status}'`
      );
    });

    // ── Phase 7: Finance authorizes disbursement ───────────────────────────────
    console.log(`\n${BOLD}Phase 7: Finance Authorizes Disbursement${RESET}`);

    await step('Finance authorizes disbursement list', async () => {
      const { status, data } = await patch(
        `/disbursements/${listId}/finance-approve`, {}, finToken
      );
      if (status === 400 && data?.error?.includes('الحالة')) return; // already approved
      assert(status === 200, `Finance approve failed: ${data?.error || status}`);
    });

    await step('Verify list status is finance_approved', async () => {
      const { status, data } = await get(`/disbursements/${listId}`, finToken);
      assert(status === 200, `GET disbursement failed: ${status}`);
      assert(
        ['finance_approved','released'].includes(data.status),
        `Expected finance_approved+, got '${data.status}'`
      );
    });

    // ── Phase 8: GM releases funds ─────────────────────────────────────────────
    console.log(`\n${BOLD}Phase 8: GM Releases Funds${RESET}`);

    await step('GM releases funds', async () => {
      const { status, data } = await patch(`/disbursements/${listId}/release`, {}, gmToken);
      if (status === 400 && data?.error?.includes('الحالة')) return; // already released
      assert(status === 200, `GM release failed: ${data?.error || status}`);
    });

    await step('Verify final status is released', async () => {
      const { status, data } = await get(`/disbursements/${listId}`, gmToken);
      assert(status === 200, `GET disbursement failed: ${status}`);
      assert(data.status === 'released', `Expected 'released', got '${data.status}'`);
    });

  } catch {
    // Error already logged in step()
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${BOLD}${BLUE}═══════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  Results: ${GREEN}${passed} passed${RESET}${BOLD} · ${RED}${failed} failed${RESET}`);
  console.log(`${BOLD}${BLUE}═══════════════════════════════════════════════${RESET}\n`);

  if (failed > 0) process.exit(1);
}

// Polyfill fetch for Node.js < 18
if (typeof fetch === 'undefined') {
  console.error(`${RED}Error: Node.js 18+ required for built-in fetch.${RESET}`);
  console.error('Run with: node --version (must be >= 18)');
  process.exit(1);
}

run().catch((err) => {
  console.error(`${RED}Unexpected error:${RESET}`, err.message);
  process.exit(1);
});
