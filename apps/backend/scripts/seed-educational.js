/**
 * seed-educational.js — Seeds sample educational & awareness programs and templates
 */

require('dotenv').config();
const { query } = require('../src/config/db');

async function seed() {
  console.log('🌱 Seeding Educational & Awareness Programs...');

  // 1. Get Categories
  const { rows: categories } = await query(`SELECT id, name FROM educational_categories`);
  const catMap = {};
  categories.forEach(c => { catMap[c.name] = c.id; });

  // 2. Seed Templates
  const templateSql = `
    INSERT INTO educational_templates
      (title, category_id, description, default_duration_days, default_sessions, target_audience)
    VALUES
      ('دورة مكثفة في حفظ القرآن الكريم', $1, 'يتم فيها حفظ سورة البقرة وتجويد التلاوة وإتقان مخارج الحروف مع مراجعة شاملة', 14, 30, 'الأيتام والطلاب المهتمون بالحفظ'),
      ('دورة مهارات الخياطة والتطريز المهني', $2, 'تدريب عملي على أساسيات الخياطة والتفصيل والتطريز لتمكين أسر الأيتام', 30, 20, 'طالبات وفتيات أسر الأيتام'),
      ('أساسيات الحاسوب وتقنيات الذكاء الاصطناعي', $3, 'مقدمة في استخدام الأدوات الرقمية الحديثة وتطبيقات الذكاء الاصطناعي لطلاب المدارس', 10, 15, 'طلاب المرحلتين الإعدادية والثانوية')
    ON CONFLICT DO NOTHING
    RETURNING id, title;
  `;

  const { rows: createdTemplates } = await query(templateSql, [
    catMap['قرآن كريم'] || categories[0]?.id,
    catMap['مهني وحرفي'] || categories[0]?.id,
    catMap['تعليمي'] || categories[0]?.id,
  ]);

  console.log(`✅ Seeded templates: ${createdTemplates.length || 'existing'}`);

  // 3. Seed Programs matching user screenshots
  const prog1 = await query(`
    INSERT INTO educational_programs
      (title, category_id, status, location, start_date, end_date, total_sessions, completed_sessions, target_count, instructor_name, notes)
    VALUES
      ('دورة تدريبية في استخدام الذكاء الصناعي', $1, 'completed', 'مركز علي بن ابي طالب', '2026-07-01', '2026-07-26', 12, 12, 25, 'م. إبراهيم الصلوي', 'دورة متقدمة في الذكاء الاصطناعي التطبيقي لطلاب الثانوية')
    RETURNING id;
  `, [catMap['تعليمي'] || categories[0]?.id]);

  const prog2 = await query(`
    INSERT INTO educational_programs
      (title, category_id, status, location, start_date, end_date, total_sessions, completed_sessions, target_count, instructor_name, notes)
    VALUES
      ('دورة صحية لطلاب الثانوي الايتام', $1, 'completed', 'مركز الاورام في تعز', '2026-07-15', '2026-08-13', 8, 8, 30, 'د. أروى عبد الله', 'محاضرات توعوية حول التغذية السليمة والوقاية الصحية والإسعافات الأولية')
    RETURNING id;
  `, [catMap['صحي'] || categories[0]?.id]);

  const prog3 = await query(`
    INSERT INTO educational_programs
      (title, category_id, status, location, start_date, end_date, total_sessions, completed_sessions, target_count, instructor_name, notes)
    VALUES
      ('خياطة', $1, 'draft', 'مشغل التدريب المهني - نماء', '2026-09-01', '2026-09-20', 1, 0, 15, 'أ. فاطمة المحمودي', 'دورة تمكين مهني وحرفي لتعليم مبادئ الخياطة وتصميم الأزياء')
    RETURNING id;
  `, [catMap['مهني وحرفي'] || categories[0]?.id]);

  console.log('✅ Seeded 3 educational programs (matching screenshots)');

  // 4. Enroll sample orphans
  const { rows: orphans } = await query(`SELECT id FROM orphans LIMIT 6`);
  if (orphans.length > 0 && prog1.rows[0]?.id) {
    for (let i = 0; i < Math.min(orphans.length, 4); i++) {
      await query(`
        INSERT INTO educational_participants (program_id, orphan_id, status, attended_sessions, notes)
        VALUES ($1, $2, 'completed', 12, 'حضور ممتاز وإتقان للمشاريع العملية')
        ON CONFLICT DO NOTHING
      `, [prog1.rows[0].id, orphans[i].id]);
    }
  }

  if (orphans.length > 2 && prog2.rows[0]?.id) {
    for (let i = 2; i < Math.min(orphans.length, 5); i++) {
      await query(`
        INSERT INTO educational_participants (program_id, orphan_id, status, attended_sessions, notes)
        VALUES ($1, $2, 'completed', 8, 'تفاعل وحضور كامل')
        ON CONFLICT DO NOTHING
      `, [prog2.rows[0].id, orphans[i].id]);
    }
  }

  console.log('✅ Enrolled sample orphans into educational programs');
  console.log('✨ Educational seeding complete.');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
