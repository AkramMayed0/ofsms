require('dotenv').config();
const { query, pool } = require('../src/config/db');

async function seedInKind() {
  try {
    const { rows: types } = await query('SELECT id, name FROM in_kind_types');
    const typeMap = {};
    types.forEach((t) => { typeMap[t.name] = t.id; });

    const { rows: sponsors } = await query('SELECT id, full_name FROM sponsors LIMIT 3');
    const { rows: orphans } = await query('SELECT id, full_name, guardian_name, guardian_relation FROM orphans LIMIT 6');

    const foodTypeId = typeMap['السلال الغذائية'] || (types[0] ? types[0].id : null);
    const eidTypeId = typeMap['كسوة العيد'] || (types[1] ? types[1].id : null);
    const schoolTypeId = typeMap['الحقيبة المدرسية'] || (types[2] ? types[2].id : null);

    // Clean existing sample in-kind programs
    await query('DELETE FROM in_kind_programs WHERE title LIKE \'%مكافأة شهر محرم%\' OR title LIKE \'%كسوة عيد الفطر%\' OR title LIKE \'%الحقيبة المدرسية%\'');

    // Program 1: مكافأة شهر محرم - السلال الغذائية
    const { rows: [p1] } = await query(
      `INSERT INTO in_kind_programs (title, type_id, sponsor_id, status, start_date, end_date, target_quantity, notes)
       VALUES ('مكافأة شهر محرم - توزيع السلال الغذائية', $1, $2, 'completed', '2026-07-02', '2026-07-29', 2, 'توزيع السلال التموينية الشهرية للأسر والأيتام الأكثر احتياجاً')
       RETURNING id`,
      [foodTypeId, sponsors[0] ? sponsors[0].id : null]
    );

    if (orphans[0]) {
      await query(
        `INSERT INTO in_kind_beneficiaries
           (program_id, orphan_id, sponsor_id, status, delivered_at, receiver_name, receiver_relation, delivery_method, notes)
         VALUES ($1, $2, $3, 'delivered', '2026-07-25 10:30:00', $4, $5, 'من المقر', 'تم استلام السلة كاملة بحالة ممتازة')`,
        [p1.id, orphans[0].id, sponsors[0] ? sponsors[0].id : null, orphans[0].guardian_name || 'الوصي', orphans[0].guardian_relation || 'عم']
      );
    }

    if (orphans[1]) {
      await query(
        `INSERT INTO in_kind_beneficiaries
           (program_id, orphan_id, sponsor_id, status, delivered_at, receiver_name, receiver_relation, delivery_method, notes)
         VALUES ($1, $2, $3, 'delivered', '2026-07-25 11:15:00', $4, $5, 'من المقر', 'تم تسليم السلة الغذائية مع كرتون تمر')`,
        [p1.id, orphans[1].id, sponsors[0] ? sponsors[0].id : null, orphans[1].guardian_name || 'الوصي', orphans[1].guardian_relation || 'عم']
      );
    }

    // Program 2: كسوة عيد الفطر
    const { rows: [p2] } = await query(
      `INSERT INTO in_kind_programs (title, type_id, sponsor_id, status, start_date, end_date, target_quantity, notes)
       VALUES ('مشروع كسوة عيد الفطر المبارك', $1, $2, 'completed', '2026-07-25', '2026-07-31', 2, 'توفير أطقم ملابس وأحذية العيد للأيتام المكفولين')
       RETURNING id`,
      [eidTypeId, sponsors[1] ? sponsors[1].id : null]
    );

    if (orphans[2]) {
      await query(
        `INSERT INTO in_kind_beneficiaries
           (program_id, orphan_id, sponsor_id, status, delivered_at, receiver_name, receiver_relation, delivery_method)
         VALUES ($1, $2, $3, 'delivered', '2026-07-28 14:00:00', $4, $5, 'توصيل للمنزل')`,
        [p2.id, orphans[2].id, sponsors[1] ? sponsors[1].id : null, orphans[2].guardian_name || 'الجد', orphans[2].guardian_relation || 'جد']
      );
    }

    if (orphans[3]) {
      await query(
        `INSERT INTO in_kind_beneficiaries
           (program_id, orphan_id, sponsor_id, status, delivered_at, receiver_name, receiver_relation, delivery_method)
         VALUES ($1, $2, $3, 'delivered', '2026-07-28 14:30:00', $4, $5, 'توصيل للمنزل')`,
        [p2.id, orphans[3].id, sponsors[1] ? sponsors[1].id : null, orphans[3].guardian_name || 'الجد', orphans[3].guardian_relation || 'جد']
      );
    }

    // Program 3: حملة الحقيبة المدرسية (Active)
    const { rows: [p3] } = await query(
      `INSERT INTO in_kind_programs (title, type_id, sponsor_id, status, start_date, end_date, target_quantity, notes)
       VALUES ('مشروع الحقيبة المدرسية والزي النموذجي', $1, $2, 'active', '2026-09-01', '2026-10-30', 4, 'تأمين الحقائب المدرسية المتكاملة مع الدفاتر والأقلام')
       RETURNING id`,
      [schoolTypeId, sponsors[2] ? sponsors[2].id : null]
    );

    if (orphans[4]) {
      await query(
        `INSERT INTO in_kind_beneficiaries
           (program_id, orphan_id, sponsor_id, status, delivery_method, receiver_name, receiver_relation)
         VALUES ($1, $2, $3, 'pending', 'من المقر', $4, $5)`,
        [p3.id, orphans[4].id, sponsors[2] ? sponsors[2].id : null, orphans[4].guardian_name || 'الخال', orphans[4].guardian_relation || 'خال']
      );
    }

    if (orphans[5]) {
      await query(
        `INSERT INTO in_kind_beneficiaries
           (program_id, orphan_id, sponsor_id, status, delivery_method, receiver_name, receiver_relation)
         VALUES ($1, $2, $3, 'pending', 'من المقر', $4, $5)`,
        [p3.id, orphans[5].id, sponsors[2] ? sponsors[2].id : null, orphans[5].guardian_name || 'الأخ', orphans[5].guardian_relation || 'أخ']
      );
    }

    console.log('✅ In-kind sample data seeded successfully!');
  } catch (err) {
    console.error('❌ Error seeding in-kind data:', err);
  } finally {
    await pool.end();
  }
}

seedInKind();
