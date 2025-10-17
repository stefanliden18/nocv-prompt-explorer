-- ===================================================================
-- FASE 1: Lägg till AF-kolumner i jobs-tabellen
-- ===================================================================

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS af_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS af_ad_id TEXT,
ADD COLUMN IF NOT EXISTS af_published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS af_error TEXT,
ADD COLUMN IF NOT EXISTS af_last_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_application_date DATE,
ADD COLUMN IF NOT EXISTS total_positions INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
ADD COLUMN IF NOT EXISTS contact_person_email TEXT,
ADD COLUMN IF NOT EXISTS contact_person_phone TEXT,
ADD COLUMN IF NOT EXISTS af_occupation_code TEXT,
ADD COLUMN IF NOT EXISTS af_municipality_code TEXT,
ADD COLUMN IF NOT EXISTS af_employment_type_code TEXT,
ADD COLUMN IF NOT EXISTS af_duration_code TEXT;

-- ===================================================================
-- FASE 2: Skapa taxonomi-tabeller för AF-koder (om de inte finns)
-- ===================================================================

CREATE TABLE IF NOT EXISTS af_occupation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label_sv TEXT NOT NULL,
  label_en TEXT,
  ssyk_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS af_municipality_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  county TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS af_employment_type_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS af_duration_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- FASE 3: Aktivera RLS för taxonomi-tabeller
-- ===================================================================

ALTER TABLE af_occupation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE af_municipality_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE af_employment_type_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE af_duration_codes ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- FASE 4: Ta bort gamla policys och skapa nya
-- ===================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read occupation codes" ON af_occupation_codes;
DROP POLICY IF EXISTS "Authenticated users can read municipality codes" ON af_municipality_codes;
DROP POLICY IF EXISTS "Authenticated users can read employment type codes" ON af_employment_type_codes;
DROP POLICY IF EXISTS "Authenticated users can read duration codes" ON af_duration_codes;
DROP POLICY IF EXISTS "Admins can manage occupation codes" ON af_occupation_codes;
DROP POLICY IF EXISTS "Admins can manage municipality codes" ON af_municipality_codes;
DROP POLICY IF EXISTS "Admins can manage employment type codes" ON af_employment_type_codes;
DROP POLICY IF EXISTS "Admins can manage duration codes" ON af_duration_codes;

-- Skapa nya policys
CREATE POLICY "Authenticated users can read occupation codes" 
  ON af_occupation_codes FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can read municipality codes" 
  ON af_municipality_codes FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can read employment type codes" 
  ON af_employment_type_codes FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can read duration codes" 
  ON af_duration_codes FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Admins can manage occupation codes" 
  ON af_occupation_codes FOR ALL 
  TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage municipality codes" 
  ON af_municipality_codes FOR ALL 
  TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage employment type codes" 
  ON af_employment_type_codes FOR ALL 
  TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage duration codes" 
  ON af_duration_codes FOR ALL 
  TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===================================================================
-- FASE 5: Skapa triggers för automatisk AF-hantering
-- ===================================================================

-- Trigger för att flagga jobb för synkning vid uppdatering
CREATE OR REPLACE FUNCTION sync_af_on_job_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.af_published = true AND (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.description_md IS DISTINCT FROM NEW.description_md OR
    OLD.contact_person_name IS DISTINCT FROM NEW.contact_person_name OR
    OLD.contact_person_email IS DISTINCT FROM NEW.contact_person_email OR
    OLD.contact_person_phone IS DISTINCT FROM NEW.contact_person_phone OR
    OLD.last_application_date IS DISTINCT FROM NEW.last_application_date OR
    OLD.af_occupation_code IS DISTINCT FROM NEW.af_occupation_code OR
    OLD.af_municipality_code IS DISTINCT FROM NEW.af_municipality_code OR
    OLD.af_employment_type_code IS DISTINCT FROM NEW.af_employment_type_code OR
    OLD.af_duration_code IS DISTINCT FROM NEW.af_duration_code
  ) THEN
    RAISE NOTICE 'Job % needs AF sync - fields changed', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_af_on_job_update ON jobs;
CREATE TRIGGER trigger_sync_af_on_job_update
AFTER UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION sync_af_on_job_update();

-- Trigger för att avpublicera från AF vid arkivering
CREATE OR REPLACE FUNCTION unpublish_af_on_archive()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'archived' AND OLD.status != 'archived' AND NEW.af_published = true THEN
    RAISE NOTICE 'Job % archived - should unpublish from AF', NEW.id;
    PERFORM pg_notify('unpublish_af', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_unpublish_af_on_archive ON jobs;
CREATE TRIGGER trigger_unpublish_af_on_archive
AFTER UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION unpublish_af_on_archive();