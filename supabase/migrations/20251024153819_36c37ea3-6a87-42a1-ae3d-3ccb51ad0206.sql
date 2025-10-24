-- Steg 1: Skapa gemensam taxonomitabell
CREATE TABLE IF NOT EXISTS af_taxonomy (
  concept_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  version INT NOT NULL,
  code TEXT,
  label TEXT NOT NULL
);

-- Index för snabb sökning
CREATE INDEX IF NOT EXISTS idx_af_tax_type_ver ON af_taxonomy(type, version);
CREATE INDEX IF NOT EXISTS idx_af_tax_code ON af_taxonomy(code);

-- Steg 2: Lägg till concept_id-kolumner i jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS af_occupation_cid TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS af_worktime_extent_cid TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS af_municipality_cid TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS af_employment_type_cid TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS af_duration_cid TEXT;

-- Index för jobs
CREATE INDEX IF NOT EXISTS idx_jobs_af_occupation_cid ON jobs(af_occupation_cid);
CREATE INDEX IF NOT EXISTS idx_jobs_af_municipality_cid ON jobs(af_municipality_cid);

-- RLS policies för af_taxonomy
ALTER TABLE af_taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read taxonomy"
  ON af_taxonomy FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage taxonomy"
  ON af_taxonomy FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));