/**
 * seed.js — Comprehensive Database Seeder for OFSMS
 *
 * Populates realistic mock data across all tables:
 * - Users (GM, Supervisor, Agents, Finance)
 * - Sponsors (with portal access credentials)
 * - Families & Orphans (with profile JSON and documents)
 * - Gifted Orphan Configurations
 * - Active Sponsorships (linking sponsors to beneficiaries)
 * - Quran Memorization Reports (historical + pending)
 * - Disbursement Lists & Items (released + pending review)
 * - Biometric Receipts (fingerprint confirmation records)
 * - Announcements & In-App Notifications
 * - Marketing Ads
 *
 * Usage:
 *   node scripts/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query } = require('../src/config/db');

async function seed() {
  console.log('🌱 Starting OFSMS comprehensive database seeding...\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── 1. Clear Existing Dynamic Data (keep governorates & schema_migrations) ─
    console.log('🧹 Cleaning previous dynamic data...');
    await client.query(`
      TRUNCATE TABLE
        ad_recipients,
        ads,
        agent_batch_confirmations,
        biometric_receipts,
        disbursement_items,
        disbursement_lists,
        quran_reports,
        gifted_configs,
        sponsorships,
        orphan_documents,
        documents,
        orphans,
        families,
        sponsors,
        notifications,
        announcements,
        fcm_tokens,
        audit_logs
      CASCADE
    `);
    // Delete test staff users (preserving any user created outside test domain if any)
    await client.query(`DELETE FROM users WHERE email LIKE '%@ofsms.local' OR email LIKE '%@test.%'`);
    console.log('   ✅ Tables cleaned.\n');

    // ── 2. Create Staff Users ──────────────────────────────────────────────────
    console.log('👥 Creating staff users...');
    const defaultPassword = 'Test@1234';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const staffUsers = [
      { name: 'أحمد عبد الله العامري', email: 'gm@ofsms.local', role: 'gm', phone: '+967770000001' },
      { name: 'عبد الرحمن سالم المشرف', email: 'supervisor@ofsms.local', role: 'supervisor', phone: '+967770000002' },
      { name: 'محمد علي الأهدل', email: 'agent@ofsms.local', role: 'agent', phone: '+967770000003' },
      { name: 'عمر ياسين التعزي', email: 'agent2@ofsms.local', role: 'agent', phone: '+967770000004' },
      { name: 'خالد عبد الملك الحميري', email: 'finance@ofsms.local', role: 'finance', phone: '+967770000005' },
    ];

    const usersMap = {};
    for (const u of staffUsers) {
      const { rows } = await client.query(
        `INSERT INTO users (full_name, email, password_hash, role, phone, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING id, full_name, email, role`,
        [u.name, u.email, passwordHash, u.role, u.phone]
      );
      usersMap[u.role === 'agent' && usersMap['agent'] ? 'agent2' : u.role] = rows[0];
      console.log(`   ✅ Created ${u.role.padEnd(10)}: ${u.email} (${u.name})`);
    }

    const gmId = usersMap['gm'].id;
    const supervisorId = usersMap['supervisor'].id;
    const agent1Id = usersMap['agent'].id;
    const agent2Id = usersMap['agent2'].id;
    const financeId = usersMap['finance'].id;

    // ── 3. Create Sponsors ─────────────────────────────────────────────────────
    console.log('\n🤝 Creating sponsors...');
    const sponsorPassword = 'Sponsor@1234';
    const sponsorPasswordHash = await bcrypt.hash(sponsorPassword, 12);

    const sponsorsData = [
      {
        name: 'الشيخ عبد الله بن ناصر الصالح',
        phone: '+967771234561',
        email: 'sponsor1@ofsms.local',
        token: 'portal_sheikh_abdullah_token_01',
      },
      {
        name: 'أم محمد (فاعلة خير)',
        phone: '+967771234562',
        email: 'sponsor2@ofsms.local',
        token: 'portal_um_mohammed_token_02',
      },
      {
        name: 'مؤسسة الأمل الخيرية للتنمية',
        phone: '+967771234563',
        email: 'sponsor3@ofsms.local',
        token: 'portal_amal_foundation_token_03',
      },
      {
        name: 'فهد بن ناصر العتيبي (كافل تجريبي)',
        phone: '+967700000001',
        email: 'sponsor@test.local',
        token: 'portal_demo_sponsor_token_04',
      },
    ];

    const sponsorsMap = [];
    for (const s of sponsorsData) {
      const { rows } = await client.query(
        `INSERT INTO sponsors (full_name, phone, email, portal_token, portal_password_hash, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, full_name, email, portal_token`,
        [s.name, s.phone, s.email, s.token, sponsorPasswordHash, gmId]
      );
      sponsorsMap.push(rows[0]);
      console.log(`   ✅ Sponsor: ${s.name} (${s.email})`);
    }

    // ── 4. Verify / Fetch Governorates ─────────────────────────────────────────
    const { rows: govRows } = await client.query(`SELECT id, name_ar FROM governorates ORDER BY id`);
    const govMap = {};
    govRows.forEach((g) => {
      govMap[g.name_ar] = g.id;
    });

    const sanaaId = govMap['صنعاء'] || 2;
    const adenId = govMap['عدن'] || 3;
    const taizId = govMap['تعز'] || 4;
    const hudaydahId = govMap['الحديدة'] || 5;
    const ibbId = govMap['إب'] || 6;

    // ── 5. Create Families ─────────────────────────────────────────────────────
    console.log('\n🏠 Creating families...');
    const familiesData = [
      {
        name: 'أسرة الشهيد يحيى الكبسي',
        head: 'فاطمة أحمد الكبسي',
        members: 4,
        govId: sanaaId,
        agentId: agent1Id,
        status: 'under_sponsorship',
        notes: 'الأسرة تسكن في بيت مستأجر، تعتمد كلياً على المساعدات',
      },
      {
        name: 'أسرة المرحوم فؤاد الحمادي',
        head: 'خديجة محمد الحمادي',
        members: 5,
        govId: taizId,
        agentId: agent2Id,
        status: 'under_sponsorship',
        notes: 'رب الأسرة توفي في حادث سير ولديهم 4 أطفال في مراحل التعليم',
      },
      {
        name: 'أسرة المرحوم أحمد الأهدل',
        head: 'زينب علي الأهدل',
        members: 3,
        govId: hudaydahId,
        agentId: agent1Id,
        status: 'under_marketing',
        notes: 'الأسرة في وضع معيشي حرج وبحاجة لكفالة سريعة',
      },
      {
        name: 'أسرة المرحوم محمد المخلافي',
        head: 'أروى عبد الله المخلافي',
        members: 6,
        govId: ibbId,
        agentId: agent2Id,
        status: 'under_review',
        notes: 'قيد دراسة الحالة والتأكد من بيانات السكن والوصاية',
      },
      {
        name: 'أسرة المرحوم سعيد بن شملان',
        head: 'نورة سالم بن شملان',
        members: 4,
        govId: adenId,
        agentId: agent1Id,
        status: 'under_sponsorship',
        notes: 'أسرة مكفولة من مؤسسة الأمل ومنتظمة بالتقارير',
      },
    ];

    const familiesMap = [];
    for (const f of familiesData) {
      const { rows } = await client.query(
        `INSERT INTO families (family_name, head_of_family, member_count, governorate_id, agent_id, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, family_name, status`,
        [f.name, f.head, f.members, f.govId, f.agentId, f.status, f.notes]
      );
      familiesMap.push(rows[0]);
      console.log(`   ✅ Family: ${f.name} [${f.status}]`);
    }

    // ── 6. Create Orphans ──────────────────────────────────────────────────────
    console.log('\n👦👧 Creating orphans...');
    const orphansData = [
      {
        name: 'عمار ياسر الكبسي',
        dob: '2015-04-12',
        gender: 'male',
        govId: sanaaId,
        guardian: 'إبراهيم أحمد الكبسي',
        relation: 'uncle',
        agentId: agent1Id,
        status: 'under_sponsorship',
        isGifted: true,
        notes: 'طالب متفوق في الصف الخامس وحافظ لـ 8 أجزاء من القرآن',
        profile: { academic_level: 'الصف الخامس', health_status: 'سليم ولله الحمد', hobbies: ['الروبوت', 'كرة القدم'] },
      },
      {
        name: 'مريم ياسر الكبسي',
        dob: '2017-09-20',
        gender: 'female',
        govId: sanaaId,
        guardian: 'إبراهيم أحمد الكبسي',
        relation: 'uncle',
        agentId: agent1Id,
        status: 'under_sponsorship',
        isGifted: false,
        notes: 'في الصف الثالث الابتدائي، منتظمة في حلقات التلاوة',
        profile: { academic_level: 'الصف الثالث', health_status: 'سليم', hobbies: ['الرسم'] },
      },
      {
        name: 'عبد الله فؤاد الحمادي',
        dob: '2014-01-15',
        gender: 'male',
        govId: taizId,
        guardian: 'محمد عبد الله الحمادي',
        relation: 'grandfather',
        agentId: agent2Id,
        status: 'under_sponsorship',
        isGifted: true,
        notes: 'موهوب في الخط العربي والإلقاء، حافظ لـ 6 أجزاء',
        profile: { academic_level: 'الصف السادس', health_status: 'سليم', hobbies: ['الخط العربي', 'الإلقاء'] },
      },
      {
        name: 'سارة فؤاد الحمادي',
        dob: '2016-06-30',
        gender: 'female',
        govId: taizId,
        guardian: 'محمد عبد الله الحمادي',
        relation: 'grandfather',
        agentId: agent2Id,
        status: 'under_sponsorship',
        isGifted: false,
        notes: 'في الصف الرابع، متميزة في مادة الرياضيات',
        profile: { academic_level: 'الصف الرابع', health_status: 'سليم', hobbies: ['القراءة'] },
      },
      {
        name: 'عمر أحمد الأهدل',
        dob: '2013-11-05',
        gender: 'male',
        govId: hudaydahId,
        guardian: 'سليمان علي الأهدل',
        relation: 'maternal_uncle',
        agentId: agent1Id,
        status: 'under_marketing',
        isGifted: false,
        notes: 'بانتظار كافل، مسجل في حوض التسويق',
        profile: { academic_level: 'الصف السابع', health_status: 'يحتاج نظارة طبية', hobbies: ['السباحة'] },
      },
      {
        name: 'فاطمة محمد المخلافي',
        dob: '2018-02-14',
        gender: 'female',
        govId: ibbId,
        guardian: 'هشام محمد المخلافي',
        relation: 'sibling',
        agentId: agent2Id,
        status: 'under_review',
        isGifted: false,
        notes: 'طلب تسجيل جديد بانتظار استكمال فحص الوثائق',
        profile: { academic_level: 'الصف الثاني', health_status: 'سليم', hobbies: ['الأناشيد'] },
      },
      {
        name: 'يوسف سعيد بن شملان',
        dob: '2012-08-22',
        gender: 'male',
        govId: adenId,
        guardian: 'ناصر سعيد بن شملان',
        relation: 'uncle',
        agentId: agent1Id,
        status: 'under_sponsorship',
        isGifted: true,
        notes: 'طالب في الصف الأول الإعدادي، حافظ لـ 12 جزءاً ومهتم بالبرمجة',
        profile: { academic_level: 'الصف الأول الإعدادي', health_status: 'سليم', hobbies: ['الحاسوب', 'الشطرنج'] },
      },
      {
        name: 'آية سعيد بن شملان',
        dob: '2015-12-10',
        gender: 'female',
        govId: adenId,
        guardian: 'ناصر سعيد بن شملان',
        relation: 'uncle',
        agentId: agent1Id,
        status: 'under_sponsorship',
        isGifted: false,
        notes: 'في الصف الخامس الابتدائي، متميزة دراسياً',
        profile: { academic_level: 'الصف الخامس', health_status: 'سليم', hobbies: ['الأشغال اليدوية'] },
      },
      {
        name: 'براء طارق القدسي',
        dob: '2015-03-18',
        gender: 'male',
        govId: sanaaId,
        guardian: 'محمود القدسي',
        relation: 'uncle',
        agentId: agent1Id,
        status: 'under_marketing',
        isGifted: true,
        notes: 'يتيم موهوب في التسويق يحتاج كفالة تشمل رسوم المدرسة',
        profile: { academic_level: 'الصف الخامس', health_status: 'سليم', hobbies: ['الابتكار العلمي'] },
      },
      {
        name: 'زينب عادل الصبري',
        dob: '2016-11-25',
        gender: 'female',
        govId: taizId,
        guardian: 'جميل الصبري',
        relation: 'maternal_uncle',
        agentId: agent2Id,
        status: 'under_sponsorship',
        isGifted: false,
        notes: 'مكفولة من الكافل التجريبي',
        profile: { academic_level: 'الصف الرابع', health_status: 'سليم', hobbies: ['التلاوة'] },
      },
    ];

    const orphansMap = [];
    for (const o of orphansData) {
      const { rows } = await client.query(
        `INSERT INTO orphans
           (full_name, date_of_birth, gender, governorate_id, guardian_name,
            guardian_relation, agent_id, status, is_gifted, notes, profile)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, full_name, status, is_gifted, date_of_birth`,
        [
          o.name,
          o.dob,
          o.gender,
          o.govId,
          o.guardian,
          o.relation,
          o.agentId,
          o.status,
          o.isGifted,
          o.notes,
          JSON.stringify(o.profile),
        ]
      );
      orphansMap.push(rows[0]);
      console.log(`   ✅ Orphan: ${o.name} [${o.status}] ${o.isGifted ? '🌟 (موهوب)' : ''}`);
    }

    // ── 7. Gifted Configurations ───────────────────────────────────────────────
    console.log('\n🌟 Configuring gifted orphan benefits...');
    const giftedConfigs = [
      {
        orphan: orphansMap.find((o) => o.full_name === 'عمار ياسر الكبسي'),
        extraMonthly: 50.0,
        school: 'مدارس الأوائل النموذجية',
        allowance: 20.0,
        notes: 'موهوب في حفظ القرآن الكريم وعلوم الروبوت',
      },
      {
        orphan: orphansMap.find((o) => o.full_name === 'عبد الله فؤاد الحمادي'),
        extraMonthly: 40.0,
        school: 'مجمع النور التعليمي',
        allowance: 15.0,
        notes: 'موهوب في الخط العربي والإلقاء الأدبي',
      },
      {
        orphan: orphansMap.find((o) => o.full_name === 'يوسف سعيد بن شملان'),
        extraMonthly: 60.0,
        school: 'ثانوية البيحاني النموذجية',
        allowance: 25.0,
        notes: 'موهبة برمجية واعدة ورياضيات متقدمة',
      },
      {
        orphan: orphansMap.find((o) => o.full_name === 'براء طارق القدسي'),
        extraMonthly: 45.0,
        school: 'مدارس النهضة الحديثة',
        allowance: 20.0,
        notes: 'موهوب في الابتكارات العلمية المصغرة',
      },
    ];

    for (const g of giftedConfigs) {
      if (!g.orphan) continue;
      await client.query(
        `INSERT INTO gifted_configs
           (orphan_id, extra_monthly_amount, school_name, school_enrolled,
            uniform_included, bag_included, transport_included, personal_allowance, notes, created_by)
         VALUES ($1, $2, $3, TRUE, TRUE, TRUE, TRUE, $4, $5, $6)`,
        [g.orphan.id, g.extraMonthly, g.school, g.allowance, g.notes, gmId]
      );
      console.log(`   ✅ Gifted bundle: ${g.orphan.full_name} (+${g.extraMonthly}$ / شهر)`);
    }

    // ── 8. Create Sponsorships ─────────────────────────────────────────────────
    console.log('\n🤝 Linking active sponsorships...');
    const sponsorshipsData = [
      // Sponsor 1 (الشيخ عبد الله)
      { sponsor: sponsorsMap[0], type: 'orphan', beneficiary: orphansMap[0], agent: agent1Id, amount: 150.0 },
      { sponsor: sponsorsMap[0], type: 'orphan', beneficiary: orphansMap[1], agent: agent1Id, amount: 100.0 },
      // Sponsor 2 (أم محمد)
      { sponsor: sponsorsMap[1], type: 'orphan', beneficiary: orphansMap[2], agent: agent2Id, amount: 140.0 },
      { sponsor: sponsorsMap[1], type: 'orphan', beneficiary: orphansMap[3], agent: agent2Id, amount: 100.0 },
      { sponsor: sponsorsMap[1], type: 'family', beneficiary: familiesMap[1], agent: agent2Id, amount: 250.0 },
      // Sponsor 3 (مؤسسة الأمل)
      { sponsor: sponsorsMap[2], type: 'orphan', beneficiary: orphansMap[6], agent: agent1Id, amount: 160.0 },
      { sponsor: sponsorsMap[2], type: 'orphan', beneficiary: orphansMap[7], agent: agent1Id, amount: 110.0 },
      { sponsor: sponsorsMap[2], type: 'family', beneficiary: familiesMap[4], agent: agent1Id, amount: 300.0 },
      // Sponsor 4 (كافل تجريبي)
      { sponsor: sponsorsMap[3], type: 'orphan', beneficiary: orphansMap[9], agent: agent2Id, amount: 120.0 },
      { sponsor: sponsorsMap[3], type: 'family', beneficiary: familiesMap[0], agent: agent1Id, amount: 200.0 },
    ];

    for (const sp of sponsorshipsData) {
      await client.query(
        `INSERT INTO sponsorships
           (sponsor_id, beneficiary_type, beneficiary_id, agent_id, start_date, monthly_amount, is_active)
         VALUES ($1, $2, $3, $4, '2024-01-01', $5, TRUE)`,
        [sp.sponsor.id, sp.type, sp.beneficiary.id, sp.agent, sp.amount]
      );
      console.log(`   ✅ Sponsorship: ${sp.sponsor.full_name} -> ${sp.beneficiary.full_name || sp.beneficiary.family_name} (${sp.amount}$)`);
    }

    // ── 9. Quran Memorization Reports ──────────────────────────────────────────
    console.log('\n📖 Creating Quran memorization reports...');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const quranOrphans = [
      { orphan: orphansMap[0], agent: agent1Id, prevJuz: 7.5, curJuz: 8.5 },
      { orphan: orphansMap[1], agent: agent1Id, prevJuz: 2.0, curJuz: 2.5 },
      { orphan: orphansMap[2], agent: agent2Id, prevJuz: 5.0, curJuz: 6.0 },
      { orphan: orphansMap[3], agent: agent2Id, prevJuz: 1.5, curJuz: 2.0 },
      { orphan: orphansMap[6], agent: agent1Id, prevJuz: 11.0, curJuz: 12.0 },
      { orphan: orphansMap[7], agent: agent1Id, prevJuz: 3.0, curJuz: 3.5 },
    ];

    for (const q of quranOrphans) {
      // 1. Previous month report (Approved)
      await client.query(
        `INSERT INTO quran_reports
           (orphan_id, agent_id, month, year, juz_memorized, status, supervisor_notes)
         VALUES ($1, $2, $3, $4, $5, 'approved', 'حفظ ممتاز ومتقن للأحكام والتلاوة')
         ON CONFLICT (orphan_id, month, year) DO NOTHING`,
        [q.orphan.id, q.agent, prevMonth, prevYear, q.prevJuz]
      );

      // 2. Current month report (Pending for first 3, Approved for rest)
      const isPending = q.orphan.full_name.includes('الكبسي');
      await client.query(
        `INSERT INTO quran_reports
           (orphan_id, agent_id, month, year, juz_memorized, status, supervisor_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (orphan_id, month, year) DO NOTHING`,
        [
          q.orphan.id,
          q.agent,
          currentMonth,
          currentYear,
          q.curJuz,
          isPending ? 'pending' : 'approved',
          isPending ? null : 'تمت المراجعة والاعتماد لشهر ' + currentMonth,
        ]
      );
      console.log(`   ✅ Quran report: ${q.orphan.full_name} (${q.curJuz} جزء) [${isPending ? 'pending' : 'approved'}]`);
    }

    // ── 10. Disbursements (Past Month Released + Current Month Active) ───────────
    console.log('\n💰 Creating disbursement lists and items...');

    // A. Previous Month: Released List with Biometric Receipts
    const { rows: [prevList] } = await client.query(
      `INSERT INTO disbursement_lists
         (month, year, status, created_by, approved_by_supervisor, approved_by_finance, approved_by_gm,
          supervisor_approved_at, finance_approved_at, gm_approved_at)
       VALUES ($1, $2, 'released', $3, $4, $5, $6, NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days', NOW() - INTERVAL '23 days')
       RETURNING id, month, year, status`,
      [prevMonth, prevYear, financeId, supervisorId, financeId, gmId]
    );

    console.log(`   ✅ Previous List: شهر ${prevMonth}/${prevYear} [released]`);

    // Add items for previous list
    for (const sp of sponsorshipsData) {
      const isOrphan = sp.type === 'orphan';
      const { rows: [item] } = await client.query(
        `INSERT INTO disbursement_items (list_id, orphan_id, family_id, amount, included)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING id`,
        [prevList.id, isOrphan ? sp.beneficiary.id : null, isOrphan ? null : sp.beneficiary.id, sp.amount]
      );

      // Create biometric receipt for each item in the released list
      await client.query(
        `INSERT INTO biometric_receipts (item_id, agent_id, fingerprint_key, confirmed_at)
         VALUES ($1, $2, $3, NOW() - INTERVAL '22 days')`,
        [item.id, sp.agent, `receipts/fingerprint_demo_${item.id}.png`]
      );
    }
    console.log(`      ↳ Added ${sponsorshipsData.length} items with biometric receipts.`);

    // B. Current Month: Supervisor Approved List (Waiting for Finance/GM Release)
    const { rows: [curList] } = await client.query(
      `INSERT INTO disbursement_lists
         (month, year, status, created_by, approved_by_supervisor, supervisor_approved_at)
       VALUES ($1, $2, 'supervisor_approved', $3, $4, NOW() - INTERVAL '2 days')
       RETURNING id, month, year, status`,
      [currentMonth, currentYear, financeId, supervisorId]
    );

    for (const sp of sponsorshipsData) {
      const isOrphan = sp.type === 'orphan';
      await client.query(
        `INSERT INTO disbursement_items (list_id, orphan_id, family_id, amount, included)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [curList.id, isOrphan ? sp.beneficiary.id : null, isOrphan ? null : sp.beneficiary.id, sp.amount]
      );
    }
    console.log(`   ✅ Current List: شهر ${currentMonth}/${currentYear} [supervisor_approved] (${sponsorshipsData.length} بند)`);

    // ── 11. Announcements ──────────────────────────────────────────────────────
    console.log('\n📢 Creating announcements...');
    const announcements = [
      {
        title: 'بدء دورة صرف مستحقات الكفالات للشهر الحالي',
        body: 'نحيطكم علماً بأنه قد تم رفع وتدقيق كشوفات الصرف الشهرية، وندعو كافة المندوبين للاستعداد لاستلام المخصصات الميدانية فور إطلاق الحوالات.',
        audience: 'staff',
      },
      {
        title: 'تنبيه: آخر موعد لرفع تقارير إنجاز حفظ القرآن الكريم',
        body: 'يرجى من جميع مندوبي الميدان التأكد من إدخال ومراجعة درجات الحفظ للأيتام المكفولين قبل تاريخ 25 من الشهر لضمان إدراجهم ضمن كشف الصرف المعتمد.',
        audience: 'staff',
      },
      {
        title: 'حملة كسوة الشتاء ورعاية الأيتام والموهوبين',
        body: 'بفضل الله تعالى ثم بدعمكم السخي، نطلق هذا الشهر مشروع كسوة الشتاء والحقيبة المدرسية للأيتام في محافظات صنعاء وتعز وعدن والحديدة وإب.',
        audience: 'sponsor',
      },
    ];

    for (const a of announcements) {
      await client.query(
        `INSERT INTO announcements (title, body, audience, created_by, published_at, is_active)
         VALUES ($1, $2, $3, $4, NOW(), TRUE)`,
        [a.title, a.body, a.audience, gmId]
      );
      console.log(`   ✅ Announcement: "${a.title}" [${a.audience}]`);
    }

    // ── 12. Notifications ──────────────────────────────────────────────────────
    console.log('\n🔔 Creating notifications...');
    const notifications = [
      { recipient: gmId, message: 'تم إدراج كشف صرف جديد لشهر ' + currentMonth + ' بانتظار الاعتماد المالي والنهائي', type: 'disbursement_reminder' },
      { recipient: supervisorId, message: 'قام المندوب محمد الأهدل برفع تقرير حفظ جديد لليتيم عمار الكبسي', type: 'quran_report_reminder' },
      { recipient: agent1Id, message: 'تم اعتماد كشف مستحقات الصرف لشهر ' + prevMonth + ' وإتمام التوقيعات البيومترية', type: 'disbursement_approved' },
      { recipient: financeId, message: 'يرجى مراجعة طلبات الصرف المستحقة لشهر ' + currentMonth, type: 'disbursement_reminder' },
    ];

    for (const n of notifications) {
      await client.query(
        `INSERT INTO notifications (recipient_id, message, type, is_read)
         VALUES ($1, $2, $3, FALSE)`,
        [n.recipient, n.message, n.type]
      );
    }
    console.log(`   ✅ Generated ${notifications.length} in-app notifications.`);

    // ── 13. Marketing Ads ──────────────────────────────────────────────────────
    console.log('\n🎯 Creating sponsor marketing ads...');
    const marketingOrphan = orphansMap.find((o) => o.status === 'under_marketing');
    if (marketingOrphan) {
      const { rows: [ad] } = await client.query(
        `INSERT INTO ads (beneficiary_type, beneficiary_id, created_by, target_all, published_at)
         VALUES ('orphan', $1, $2, TRUE, NOW())
         RETURNING id`,
        [marketingOrphan.id, gmId]
      );

      for (const sp of sponsorsMap) {
        await client.query(
          `INSERT INTO ad_recipients (ad_id, sponsor_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [ad.id, sp.id]
        );
      }
      console.log(`   ✅ Created marketing ad for orphan: ${marketingOrphan.full_name}`);
    }

    await client.query('COMMIT');
    console.log('\n🎉 ALL SEED DATA APPLIED SUCCESSFULLY!\n');

    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('🔑 TEST ACCOUNTS CREDENTIALS SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('Staff Accounts (Password: Test@1234)');
    console.log('  👑 General Manager (GM):    gm@ofsms.local');
    console.log('  👔 Supervisor:             supervisor@ofsms.local');
    console.log('  💼 Finance Manager:        finance@ofsms.local');
    console.log('  📱 Field Agent 1:          agent@ofsms.local');
    console.log('  📱 Field Agent 2:          agent2@ofsms.local');
    console.log('───────────────────────────────────────────────────────────────────────');
    console.log('Sponsor Portal Accounts (Password: Sponsor@1234)');
    for (const s of sponsorsMap) {
      console.log(`  🤝 ${s.full_name}`);
      console.log(`     Email: ${s.email}`);
      console.log(`     URL:   http://localhost:3000/sponsor/portal?token=${s.portal_token}`);
    }
    console.log('═══════════════════════════════════════════════════════════════════════\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Seeding failed with error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
