/**
 * landing.service.js — Landing Page CMS Business Logic & Persistence
 */

const { query } = require('../../config/db');

const DEFAULT_LANDING_CONTENT = {
  sections: {
    hero: true,
    about: true,
    stats: true,
    programs: true,
    news: true,
    gallery: true,
    achievements: true,
    partners: true,
    contact: true,
  },
  hero: {
    foundationName: 'مؤسسة نماء التنموية الخيرية',
    slogan: 'ريادة في التمكين وبناء الإنسان ورعاية الأسر المتعففة والأيتام',
    shortBio: 'نعمل برؤية تنموية رائدة وشراكات مجتمعية فاعلة لبناء مجتمع متكافل ومستدام يحفظ كرامة الإنسان ويحقق الأثر الإيجابي المنشود.',
    ctaText: 'تعرف علينا',
    ctaLink: '#about',
    loginText: 'دخول النظام',
    showCta: true,
    logoUrl: '',
    bgUrl: '',
  },
  about: {
    imageUrl: '',
    aboutText: 'مؤسسة نماء التنموية الخيرية مؤسسة غير ربحية تُعنى بتمكين الأفراد والأسر، ورعاية الفئات الأكثر احتياجاً من خلال برامج تنموية واجتماعية وتعليمية مستدامة، تسعى إلى إحداث أثر إيجابي في المجتمع عبر العمل المؤسسي، والشراكات الفاعلة، والحوكمة، والاستثمار الأمثل للموارد بما يحقق التنمية المستدامة ويحفظ كرامة المستفيد.',
    vision: 'أن نكون مؤسسة رائدة في العمل التنموي والخيري، تُسهم في بناء مجتمع متكافل ومستدام، وتحقق أثراً تنموياً ملموساً على المستفيدين.',
    mission: 'تقديم برامج ومبادرات تنموية وخيرية ذات جودة عالية، ترتكز على الاحتياج الحقيقي، وتُنفذ وفق أفضل الممارسات المؤسسية، بالشراكة مع الداعمين والجهات ذات العلاقة، بما يعزز الاستدامة ويحقق أثراً مستداماً للمستفيدين.',
    values: `• الإخلاص: العمل ابتغاء مرضاة الله
• الأمانة: حفظ الحقوق والموارد
• الشفافية: الوضوح والمصداقية في جميع الأعمال
• التميز: تقديم أعلى معايير الجودة في كافة البرامج
• التعاون والشراكة: تكامل الجهود مع المجتمع والشركاء`,
  },
  stats: [
    { id: '1', title: 'الأسر المستفيدة', value: '504142', description: 'عدد الأسر التي استفادت من برامج المؤسسة.', active: true },
    { id: '2', title: 'الأيتام المكفولون', value: '400', description: 'إجمالي الأيتام الذين ترعاهم المؤسسة.', active: true },
    { id: '3', title: 'البرامج والمشاريع', value: '45742', description: 'إجمالي البرامج والمشاريع المنفذة.', active: true },
    { id: '4', title: 'المتطوعون', value: '254', description: 'عدد المتطوعين المشاركين في أنشطة المؤسسة.', active: true },
    { id: '5', title: 'البرامج التعليمية والتربوية', value: '451', description: 'عدد البرامج التعليمية والتربوية المنفذة.', active: true },
  ],
  programs: [
    {
      id: '1',
      title: 'برنامج كفالة ورعاية الأيتام',
      category: 'رعاية اجتماعية',
      description: 'كفالات شهرية، رعاية صحية، ومتابعة تعليمية ودعم بيومترى مباشر يضمن وصول الإعانات لمستحقيها بكرامة.',
      beneficiaries: '400+ يتيم',
      active: true,
    },
    {
      id: '2',
      title: 'مبادرة تمكين الأسر المنتجة',
      category: 'تمكين وتنمية',
      description: 'تقديم قروض حسنة وتدريب مهني للأمهات وأرباب الأسر في الخياطة والحرف لتحويلهم لأسر منتجة ومكتفية ذاتياً.',
      beneficiaries: '150+ أسرة',
      active: true,
    },
    {
      id: '3',
      title: 'حلقات القرآن ومراكز الموهوبين',
      category: 'تعليم وقرآن',
      description: 'رعاية الأيتام الموهوبين دراسياً وحفظة القرآن الكريم وتوفير مستلزمات التعليم والمنح النموذجية لهم.',
      beneficiaries: '320+ طالب',
      active: true,
    },
    {
      id: '4',
      title: 'الإغاثة والمساعدات الطارئة',
      category: 'إغاثة موسمية',
      description: 'توزيع السلال الغذائية، كسوة الشتاء، مساعدات رمضان وعيد الأضحى، وتوفير الأدوية للحالات المزمنة.',
      beneficiaries: '25,000+ مستفيد',
      active: true,
    },
  ],
  news: [
    {
      id: '1',
      title: 'تدشين المرحلة الجديدة لكفالة ورعاية 400 يتيم للعام الجاري',
      date: '2026-10-15',
      summary: 'أطلقت المؤسسة خطتها التشغيلية الشاملة لرعاية الأيتام في 5 محافظات وتحديث سجلات البصمة البيومترية.',
      active: true,
    },
    {
      id: '2',
      title: 'توزيع الحقيبة المدرسية والزي الموحد للموهوبين والمتميزين',
      date: '2026-09-28',
      summary: 'توزيع مستلزمات العام الدراسي الجديد لأبناء الأسر المستفيدة في أمانة العاصمة وتعز وعدن.',
      active: true,
    },
    {
      id: '3',
      title: 'اختتام ورشة عمل تطوير الأداء الميداني للمندوبين والمشرفين',
      date: '2026-09-10',
      summary: 'اختتام دورة التدريب على استخدام النظام الإلكتروني وإجراءات تدقيق ومصادقة مستحقات الصرف.',
      active: true,
    },
  ],
  gallery: [
    { id: '1', title: 'توزيع كفالات الأيتام الشهرية', category: 'ميداني', imageUrl: '' },
    { id: '2', title: 'تكريم حفظة القرآن الكريم والموهوبين', category: 'فعاليات', imageUrl: '' },
    { id: '3', title: 'تسليم أدوات التمكين المهني للأسر', category: 'تنمية', imageUrl: '' },
    { id: '4', title: 'حملة كسوة الشتاء والحقيبة المدرسية', category: 'مشاريع', imageUrl: '' },
  ],
  achievements: [
    { id: '1', title: 'أكثر من نصف مليون مستفيد', year: '2026', description: 'وصول أثر البرامج التنموية والإنسانية لأكثر من 504 ألف فرد وأسرة.' },
    { id: '2', title: 'نسبة شفافية ومصداقية 100%', year: '2025', description: 'تطبيق نظام السندات البيومترية المؤتمتة لكافة تسليمات الصرف المالي.' },
    { id: '3', title: 'رعاية شاملة مستدامة للموهوبين', year: '2024', description: 'بناء باقات تأهيل متكاملة تغطي المدارس النموذجية والمواصلات والبدلات.' },
  ],
  partners: [
    { id: '1', name: 'مؤسسة الأمل الخيرية للتنمية', category: 'شريك استراتيجي' },
    { id: '2', name: 'صندوق دعم وتأهيل الأيتام', category: 'شريك حكومي' },
    { id: '3', name: 'مبادرة عطاء بلا حدود الدولية', category: 'شريك دولي' },
    { id: '4', name: 'مجموعة النور التجارية الداعمة', category: 'قطاع خاص' },
  ],
  contact: {
    phone: '+967 1 450123',
    mobile: '+967 770 000 001',
    whatsapp: '+967 770 000 001',
    email: 'info@namaa-charity.org',
    address: 'الجمهورية اليمنية - صنعاء - شارع الستين الغربي',
    workingHours: 'السبت - الخميس: 8:00 صباحاً - 3:00 مساءً',
    social: {
      facebook: 'https://facebook.com/namaa.charity',
      twitter: 'https://x.com/namaa_charity',
      instagram: 'https://instagram.com/namaa_charity',
      youtube: 'https://youtube.com/@namaa_charity',
    },
  },
};

/**
 * Fetch complete landing content from DB merged with defaults.
 */
const getLandingContent = async () => {
  const { rows } = await query(`SELECT key, data FROM landing_content`);
  const result = { ...DEFAULT_LANDING_CONTENT };

  for (const row of rows) {
    if (row.key in result) {
      if (Array.isArray(result[row.key])) {
        result[row.key] = Array.isArray(row.data) ? row.data : result[row.key];
      } else if (typeof result[row.key] === 'object' && result[row.key] !== null) {
        result[row.key] = { ...result[row.key], ...row.data };
      } else {
        result[row.key] = row.data;
      }
    }
  }

  return result;
};

/**
 * Update a specific section's content in the database.
 */
const updateSection = async (sectionKey, data) => {
  const { rows } = await query(
    `INSERT INTO landing_content (key, data, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE
     SET data = EXCLUDED.data, updated_at = NOW()
     RETURNING key, data, updated_at`,
    [sectionKey, JSON.stringify(data)]
  );
  return rows[0];
};

/**
 * Save full landing content payload in bulk.
 */
const updateAllLandingContent = async (payload) => {
  for (const [key, value] of Object.entries(payload)) {
    if (key in DEFAULT_LANDING_CONTENT) {
      await updateSection(key, value);
    }
  }
  return getLandingContent();
};

module.exports = {
  DEFAULT_LANDING_CONTENT,
  getLandingContent,
  updateSection,
  updateAllLandingContent,
};
