-- Migration 020: Educational & Awareness Programs (البرامج التربوية والتوعوية والأنشطة)

CREATE TABLE IF NOT EXISTS educational_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50) DEFAULT 'book',
  color VARCHAR(50) DEFAULT 'emerald',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial categories
INSERT INTO educational_categories (name, icon, color) VALUES
  ('تعليمي', 'graduation-cap', 'blue'),
  ('صحي', 'heart-pulse', 'emerald'),
  ('مهني وحرفي', 'scissors', 'amber'),
  ('قرآن كريم', 'book-open', 'teal'),
  ('تربوي وقيمي', 'sparkles', 'indigo'),
  ('ثقافي ورياضي', 'trophy', 'purple')
ON CONFLICT (name) DO NOTHING;

-- Templates (قوالب البرامج المتكررة)
CREATE TABLE IF NOT EXISTS educational_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  category_id INT REFERENCES educational_categories(id) ON DELETE SET NULL,
  description TEXT,
  default_duration_days INT DEFAULT 14,
  default_sessions INT DEFAULT 30,
  target_audience VARCHAR(150) DEFAULT 'الأيتام والطلاب',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programs (البرامج والأنشطة المنفذة)
CREATE TABLE IF NOT EXISTS educational_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  category_id INT REFERENCES educational_categories(id) ON DELETE SET NULL,
  template_id UUID REFERENCES educational_templates(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  location VARCHAR(255),
  start_date DATE,
  end_date DATE,
  total_sessions INT DEFAULT 1,
  completed_sessions INT DEFAULT 0,
  target_count INT DEFAULT 20,
  instructor_name VARCHAR(150),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants (المشاركون من الأيتام في كل برنامج)
CREATE TABLE IF NOT EXISTS educational_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES educational_programs(id) ON DELETE CASCADE,
  orphan_id UUID NOT NULL REFERENCES orphans(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped')),
  attended_sessions INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (program_id, orphan_id)
);

CREATE INDEX IF NOT EXISTS idx_edu_prog_status ON educational_programs(status);
CREATE INDEX IF NOT EXISTS idx_edu_prog_category ON educational_programs(category_id);
CREATE INDEX IF NOT EXISTS idx_edu_part_program ON educational_participants(program_id);
CREATE INDEX IF NOT EXISTS idx_edu_part_orphan ON educational_participants(orphan_id);
