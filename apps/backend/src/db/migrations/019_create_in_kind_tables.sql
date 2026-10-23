-- OFSMS Migration 019 — In-Kind Support Programs (برامج الدعم العيني)
-- Handles non-cash aid distribution (food baskets, Eid clothes, school bags, etc.)
-- Links beneficiaries (orphans/families) to programs and sponsors (donors).

CREATE TABLE IF NOT EXISTS in_kind_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  unit VARCHAR(50) NOT NULL DEFAULT 'قطعة',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS in_kind_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  type_id INTEGER REFERENCES in_kind_types(id) ON DELETE SET NULL,
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE SET NULL, -- Sponsoring donor (optional)
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  target_quantity INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_in_kind_programs_status ON in_kind_programs(status);
CREATE INDEX IF NOT EXISTS idx_in_kind_programs_type ON in_kind_programs(type_id);
CREATE INDEX IF NOT EXISTS idx_in_kind_programs_sponsor ON in_kind_programs(sponsor_id);

CREATE TABLE IF NOT EXISTS in_kind_beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES in_kind_programs(id) ON DELETE CASCADE,
  orphan_id UUID REFERENCES orphans(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE SET NULL, -- Sponsoring donor attributed to this beneficiary
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'absent', 'cancelled')),
  delivered_at TIMESTAMPTZ,
  delivered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  receiver_name VARCHAR(150),
  receiver_relation VARCHAR(100),
  delivery_method VARCHAR(100) DEFAULT 'من المقر',
  receipt_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_one_in_kind_beneficiary CHECK (
    (orphan_id IS NOT NULL AND family_id IS NULL) OR
    (orphan_id IS NULL AND family_id IS NOT NULL)
  ),
  CONSTRAINT uq_in_kind_orphan UNIQUE (program_id, orphan_id),
  CONSTRAINT uq_in_kind_family UNIQUE (program_id, family_id)
);

CREATE INDEX IF NOT EXISTS idx_in_kind_ben_prog ON in_kind_beneficiaries(program_id);
CREATE INDEX IF NOT EXISTS idx_in_kind_ben_orphan ON in_kind_beneficiaries(orphan_id);
CREATE INDEX IF NOT EXISTS idx_in_kind_ben_family ON in_kind_beneficiaries(family_id);
CREATE INDEX IF NOT EXISTS idx_in_kind_ben_sponsor ON in_kind_beneficiaries(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_in_kind_ben_status ON in_kind_beneficiaries(status);

-- Seed common in-kind types
INSERT INTO in_kind_types (name, unit) VALUES
  ('السلال الغذائية', 'سلة'),
  ('كسوة العيد', 'طقم'),
  ('الحقيبة المدرسية', 'حقيبة'),
  ('الأضاحي ولحوم الصدقات', 'أضحية'),
  ('الكسوة الشتوية والبطانيات', 'طقم'),
  ('التمور الرمضانية', 'كجم'),
  ('زكاة الفطر', 'حصة'),
  ('المواد الصحية والمنظفات', 'حقيبة'),
  ('الأجهزة الكهربائية والمنزلية', 'جهاز'),
  ('الأجهزة الطبية ومساعدات المرضى', 'جهاز'),
  ('الأثاث المنزلي', 'قطعة')
ON CONFLICT (name) DO NOTHING;
