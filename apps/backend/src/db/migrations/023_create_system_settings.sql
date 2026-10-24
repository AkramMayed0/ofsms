-- ============================================================
-- OFSMS Migration 023 — System Settings & Reference Lists
-- ============================================================

-- 1. System Settings Key-Value Table
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO system_settings (key, value)
VALUES
  ('identity', '{
    "logo_url": "/logo.png",
    "org_name_ar": "مؤسسة نماء التنموية الخيرية",
    "org_name_en": "Namaa Charitable Foundation",
    "tagline_ar": "تهدف لخدمة وتنمية المجتمع صحياً وثقافياً واجتماعياً ومهنياً",
    "tagline_en": "It aims to serve and develop the community health-wise, culturally, socially, and professionally",
    "default_language": "ar"
  }'::jsonb),
  ('numbering_currency', '{
    "default_currency": "YER",
    "sponsor_prefix": "SPN",
    "orphan_prefix": "ORP",
    "family_prefix": "FAM"
  }'::jsonb),
  ('sponsor_messages', '{
    "portal_url": "http://localhost:3000/sponsor/login",
    "template": "🌿 السلام عليكم {{name}}\n\nتم إنشاء حسابك في بوابة الكافل — {{org_name}}\n\nرقم الكافل: {{code}}\nكلمة المرور: {{password}}\nرابط الدخول: {{portal_url}}\n\nيرجى الحفاظ على بياناتك وعدم مشاركتها مع أي شخص.\nجزاك الله خيراً على عطائك."
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Reference Lists (القوائم المرجعية)
CREATE TABLE IF NOT EXISTS reference_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  extra_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reference_category ON reference_lists(category);
CREATE INDEX IF NOT EXISTS idx_reference_sort ON reference_lists(category, sort_order ASC);

-- Seed reference lists matching user screenshot & needs
INSERT INTO reference_lists (category, name, description, sort_order, is_active)
VALUES
  -- برامج المساعدة (Assistance Programs)
  ('assistance_programs', 'كسوة العيد', 'توزيع ملابس العيد للأيتام والأسر', 10, TRUE),
  ('assistance_programs', 'الأضاحي', 'توزيع لحوم الأضاحي في عيد الأضحى', 20, TRUE),
  ('assistance_programs', 'التمر', 'توزيع التمور الموسمية', 30, TRUE),
  ('assistance_programs', 'مكافآت مالية', 'مكافآت تفوق دراسي ودعم طارئ', 40, TRUE),
  ('assistance_programs', 'سلة رمضان', 'السلال الغذائية الرمضانية', 50, TRUE),

  -- العملات (Currencies)
  ('currencies', 'ريال يمني (YER)', 'العملة المحلية الافتراضية', 10, TRUE),
  ('currencies', 'دولار أمريكي (USD)', 'عملة دولية للتحويلات الخارجية', 20, TRUE),
  ('currencies', 'ريال سعودي (SAR)', 'عملة إقليمية', 30, TRUE),

  -- تصنيفات المستفيدين (Beneficiary Categories)
  ('beneficiary_types', 'أيتام - فاقد الأب', 'أيتام قصر فاقدو الأب', 10, TRUE),
  ('beneficiary_types', 'أيتام - فاقد الأبوين', 'أيتام كليون فاقدو الأبوين', 20, TRUE),
  ('beneficiary_types', 'أسر متعففة', 'أسر أيتام شديدة الاحتياج', 30, TRUE),
  ('beneficiary_types', 'موهوبون ومتفوقون', 'أيتام موهوبون ومتميزون أكاديمياً', 40, TRUE),

  -- الجنسيات (Nationalities)
  ('nationalities', 'يمني', 'الجنسية الأصلية', 10, TRUE),
  ('nationalities', 'سوري', 'مقيم', 20, TRUE),
  ('nationalities', 'فلسطيني', 'مقيم', 30, TRUE),
  ('nationalities', 'أخرى', 'جنسيات أخرى', 40, TRUE),

  -- المدن والمحافظات (Cities & Governorates)
  ('cities', 'أمانة العاصمة', 'العاصمة صنعاء', 10, TRUE),
  ('cities', 'صنعاء (الريف)', 'محافظة صنعاء', 20, TRUE),
  ('cities', 'عدن', 'العاصمة المؤقتة', 30, TRUE),
  ('cities', 'تعز', 'محافظة تعز', 40, TRUE),
  ('cities', 'الحديدة', 'محافظة الحديدة', 50, TRUE),
  ('cities', 'إب', 'محافظة إب', 60, TRUE),

  -- معايير التقييم (Evaluation Criteria)
  ('criteria', 'الالتزام بحفظ القرآن الكريم', 'معيار قرآني أساسي', 10, TRUE),
  ('criteria', 'المستوى الدراسي العام', 'معيار تعليمي أكاديمي', 20, TRUE),
  ('criteria', 'الحالة الصحية', 'معيار رعاية طبية', 30, TRUE),
  ('criteria', 'الحالة النفسية والسلوكية', 'معيار سلوكي ونفسي', 40, TRUE),
  ('criteria', 'النظافة والمظهر العام', 'معيار عناية ومظهر', 50, TRUE),
  ('criteria', 'الحالة الأسرية والاستقرار', 'معيار الاستقرار الأسري', 60, TRUE)
ON CONFLICT DO NOTHING;

-- 3. System Backups (النسخ الاحتياطي)
CREATE TABLE IF NOT EXISTS system_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  backup_type VARCHAR(50) NOT NULL DEFAULT 'manual',
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  download_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-seed an initial sample backup
INSERT INTO system_backups (filename, size_bytes, backup_type, status, created_at)
VALUES
  ('backup_ofsms_full_20261024_0800.dump', 1845210, 'scheduled', 'completed', NOW() - INTERVAL '1 day'),
  ('backup_ofsms_db_20261024_1800.sql', 1245080, 'manual', 'completed', NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;
