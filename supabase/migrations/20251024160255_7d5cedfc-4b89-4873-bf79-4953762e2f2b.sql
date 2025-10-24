-- Step 1: Clean up database columns
ALTER TABLE jobs DROP COLUMN IF EXISTS af_municipality_concept_id;

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_af_occupation_cid ON jobs(af_occupation_cid);
CREATE INDEX IF NOT EXISTS idx_jobs_af_municipality_cid ON jobs(af_municipality_cid);
CREATE INDEX IF NOT EXISTS idx_jobs_af_employment_type_cid ON jobs(af_employment_type_cid);
CREATE INDEX IF NOT EXISTS idx_jobs_af_duration_cid ON jobs(af_duration_cid);
CREATE INDEX IF NOT EXISTS idx_jobs_af_worktime_extent_cid ON jobs(af_worktime_extent_cid);

-- Step 3: Add missing columns to af_taxonomy
ALTER TABLE af_taxonomy ADD COLUMN IF NOT EXISTS lang TEXT DEFAULT 'sv';
ALTER TABLE af_taxonomy ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 4: Add index on af_taxonomy
CREATE INDEX IF NOT EXISTS idx_af_taxonomy_lookup ON af_taxonomy(concept_id, type, version);

-- Step 5: Add Foreign Key constraints (using DO block to check if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_occ_fk') THEN
    ALTER TABLE jobs ADD CONSTRAINT jobs_occ_fk 
      FOREIGN KEY (af_occupation_cid) REFERENCES af_taxonomy(concept_id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_wte_fk') THEN
    ALTER TABLE jobs ADD CONSTRAINT jobs_wte_fk 
      FOREIGN KEY (af_worktime_extent_cid) REFERENCES af_taxonomy(concept_id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_muni_fk') THEN
    ALTER TABLE jobs ADD CONSTRAINT jobs_muni_fk 
      FOREIGN KEY (af_municipality_cid) REFERENCES af_taxonomy(concept_id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_emp_type_fk') THEN
    ALTER TABLE jobs ADD CONSTRAINT jobs_emp_type_fk 
      FOREIGN KEY (af_employment_type_cid) REFERENCES af_taxonomy(concept_id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_duration_fk') THEN
    ALTER TABLE jobs ADD CONSTRAINT jobs_duration_fk 
      FOREIGN KEY (af_duration_cid) REFERENCES af_taxonomy(concept_id) ON DELETE SET NULL;
  END IF;
END $$;