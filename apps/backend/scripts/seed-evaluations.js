/**
 * seed-evaluations.js
 * Seeds sample researcher periodic evaluations matching the user's design.
 */

require('dotenv').config();
const { query } = require('../src/config/db');

async function seedEvaluations() {
  console.log('Seeding sample periodic evaluations...');

  // Get first orphan
  const { rows: orphans } = await query(`SELECT id, full_name FROM orphans LIMIT 2`);
  // Get first family
  const { rows: families } = await query(`SELECT id, family_name FROM families LIMIT 1`);
  // Get a GM or supervisor user
  const { rows: users } = await query(`SELECT id FROM users WHERE role IN ('gm', 'supervisor', 'agent') LIMIT 1`);
  const researcherId = users[0]?.id || null;

  if (orphans.length > 0) {
    const orphan = orphans[0];
    console.log(`Adding evaluations for orphan: ${orphan.full_name}`);

    // Evaluation 1 (Latest - 67%)
    const criteria1 = [
      { id: 'quran', category: 'قرآني', title: 'الالتزام بحفظ القرآن الكريم', score: 2, max_score: 5, notes: 'يحتاج لمتابعة في التسميع' },
      { id: 'academic', category: 'تعليمي', title: 'المستوى الدراسي العام', score: 3, max_score: 5, notes: 'جيد في اللغة العربية ومتوسط في الرياضيات' },
      { id: 'summer', category: 'تعليمي', title: 'البرنامج الصيفي والأنشطة', score: 3.5, max_score: 5, notes: 'حضور منتظم ومشاركة جيدة' },
      { id: 'health', category: 'صحي', title: 'الحالة الصحية', score: 5, max_score: 5, notes: 'بصحة ممتازة ولا يعاني من أي أمراض مزمنة' },
      { id: 'behavioral', category: 'سلوكي', title: 'الحالة النفسية والسلوكية', score: 4, max_score: 5, notes: 'هادئ ومتعاون مع أقرانه' },
      { id: 'hygiene', category: 'سلوكي', title: 'النظافة والمظهر العام', score: 4, max_score: 5, notes: 'مهتم بالنظافة الشخصية والزي' },
      { id: 'family', category: 'أسري', title: 'الحالة الأسرية والاستقرار', score: 2, max_score: 5, notes: 'تحديات في السكن ونفقات المعيشة' },
      { id: 'hadith', category: 'حديث', title: 'حفظ الحديث النبوي والآداب', score: 3.5, max_score: 5, notes: 'أتم حفظ 20 حديثاً نبوياً' }
    ];

    await query(`
      INSERT INTO periodic_evaluations (
        beneficiary_type, beneficiary_id, evaluation_date, period_name,
        show_in_sponsor_portal, overall_score, criteria_scores,
        general_summary, recommendations, researcher_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
    `, [
      'orphan', orphan.id, '2026-07-31', 'الربع الثالث 2026',
      true, 67.0, JSON.stringify(criteria1),
      'اليتيم منتظم في دراسته ومركز التحفيظ، إلا أن الأسرة تواجه ضغوطاً معيشية تؤثر على الاستقرار.',
      'توفير حقيبة مدرسية ومتابعة صحية دورية ودعم الأسرة بسلة غذائية إضافية.',
      researcherId
    ]);

    // Evaluation 2 (Previous - 86%)
    const criteria2 = [
      { id: 'quran', category: 'قرآني', title: 'الالتزام بحفظ القرآن الكريم', score: 3, max_score: 5, notes: 'انتهت من حفظ 5 أجزاء' },
      { id: 'academic', category: 'تعليمي', title: 'المستوى الدراسي العام', score: 4.5, max_score: 5, notes: 'ممتازة ونتائج اختباراتها مرتفعة' },
      { id: 'summer', category: 'تعليمي', title: 'البرنامج الصيفي والأنشطة', score: 4, max_score: 5, notes: 'تفاعل ممتاز في نادي الخط والرسم' },
      { id: 'health', category: 'صحي', title: 'الحالة الصحية', score: 5, max_score: 5, notes: 'تعاني من تقرحات خفيفة وتم صرف العلاج اللازم' },
      { id: 'behavioral', category: 'سلوكي', title: 'الحالة النفسية والسلوكية', score: 4, max_score: 5, notes: 'جيدة جداً ومحبوبة' },
      { id: 'hygiene', category: 'سلوكي', title: 'النظافة والمظهر العام', score: 5, max_score: 5, notes: 'مظهر مرتب ونظافة تامة' },
      { id: 'family', category: 'أسري', title: 'الحالة الأسرية والاستقرار', score: 4, max_score: 5, notes: 'استقرار نسبي بفضل الكفالة المنتظمة' },
      { id: 'hadith', category: 'حديث', title: 'حفظ الحديث النبوي والآداب', score: 4, max_score: 5, notes: 'حفظت الآداب الإسلامية اليومية' }
    ];

    await query(`
      INSERT INTO periodic_evaluations (
        beneficiary_type, beneficiary_id, evaluation_date, period_name,
        show_in_sponsor_portal, overall_score, criteria_scores,
        general_summary, recommendations, researcher_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
    `, [
      'orphan', orphan.id, '2026-07-16', 'الربع الثاني 2026',
      true, 86.0, JSON.stringify(criteria2),
      'تطور ملحوظ في الأداء الدراسي وحفظ كتاب الله مع ثناء المعلمين في المدرسة.',
      'الاستمرار في تشجيعها وتقديم شهادة تقدير لحفظ القرآن.',
      researcherId
    ]);
  }

  if (families.length > 0) {
    const family = families[0];
    console.log(`Adding evaluation for family: ${family.family_name}`);

    const familyCriteria = [
      { id: 'living', category: 'معيشي واقتصادي', title: 'الوضع المعيشي ومصادر الدخل', score: 3.5, max_score: 5, notes: 'الاعتماد الأساسي على كفالة الأسرة وتوفير الاحتياجات الضرورية' },
      { id: 'housing', category: 'سكني وبيئي', title: 'صلاحية ونظافة بيئة السكن', score: 4, max_score: 5, notes: 'السكن مناسب وتتوفر به متطلبات السلامة الأساسية' },
      { id: 'health', category: 'صحي', title: 'الحالة الصحية العامة لأفراد الأسرة', score: 4.5, max_score: 5, notes: 'لا توجد حالات مرضية حرجة' },
      { id: 'education', category: 'تربوي وتعليمي', title: 'متابعة واستقرار تعليم الأبناء', score: 5, max_score: 5, notes: 'جميع الأبناء ملتحقون بالمدارس ومواظبون' },
      { id: 'cohesion', category: 'اجتماعي وأسري', title: 'التماسك والاستقرار الأسري', score: 4, max_score: 5, notes: 'بيئة أسرية دافئة ومتعاونة' },
      { id: 'moral', category: 'قيمي وديني', title: 'الالتزام الأخلاقي والقيمي', score: 5, max_score: 5, notes: 'حرص كبير من الأم على غرس القيم الفاضلة' }
    ];

    await query(`
      INSERT INTO periodic_evaluations (
        beneficiary_type, beneficiary_id, evaluation_date, period_name,
        show_in_sponsor_portal, overall_score, criteria_scores,
        general_summary, recommendations, researcher_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
    `, [
      'family', family.id, '2026-08-01', 'الربع الثالث 2026',
      true, 87.0, JSON.stringify(familyCriteria),
      'أسرة نموذجية في إدارة شؤونها وتربية الأبناء رغم شح الموارد المالية.',
      'توفير مشروع تمكين اقتصادي صغير للأم (خياطة وتطريز) لزيادة دخل الأسرة.',
      researcherId
    ]);
  }

  console.log('✅ Seeding periodic evaluations complete!');
}

seedEvaluations().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
