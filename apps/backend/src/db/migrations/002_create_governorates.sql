-- ============================================================
-- OFSMS Migration 002 — Governorates lookup table
-- Dependency: 000_init.sql (pgcrypto extension)
-- ============================================================
CREATE TABLE IF NOT EXISTS governorates (
  id SERIAL PRIMARY KEY,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS governorates_name_ar_unique ON governorates (name_ar);

CREATE UNIQUE INDEX IF NOT EXISTS governorates_name_en_unique ON governorates (name_en);

-- Seed all 22 Yemeni governorates
INSERT INTO
  governorates (name_ar, name_en)
VALUES
  ('أمانة العاصمة', 'Amanat Al Asimah'),
  ('صنعاء', 'Sanaa'),
  ('عدن', 'Aden'),
  ('تعز', 'Taiz'),
  ('الحديدة', 'Hudaydah'),
  ('إب', 'Ibb'),
  ('حجة', 'Hajjah'),
  ('ذمار', 'Dhamar'),
  ('البيضاء', 'Al Bayda'),
  ('شبوة', 'Shabwah'),
  ('مأرب', 'Marib'),
  ('الجوف', 'Al Jawf'),
  ('عمران', 'Amran'),
  ('المحويت', 'Al Mahwit'),
  ('ريمة', 'Raymah'),
  ('لحج', 'Lahij'),
  ('أبين', 'Abyan'),
  ('الضالع', 'Ad Dali'),
  ('حضرموت', 'Hadhramaut'),
  ('المهرة', 'Al Mahrah'),
  ('سقطرى', 'Socotra'),
  ('صعدة', 'Saada') ON CONFLICT DO NOTHING;