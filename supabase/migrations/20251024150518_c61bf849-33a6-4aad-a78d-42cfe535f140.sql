-- 1) Lägg till kolumn för concept_id i jobs (ingen foreign key)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS af_municipality_concept_id TEXT;

-- 2) Backfill från kod -> concept_id
UPDATE jobs j
SET af_municipality_concept_id = m.concept_id
FROM af_municipality_codes m
WHERE m.code = j.af_municipality_code
  AND j.af_municipality_concept_id IS NULL
  AND j.af_municipality_code IS NOT NULL;

-- 3) Index för snabbare lookups
CREATE INDEX IF NOT EXISTS idx_jobs_af_municipality_concept_id 
ON jobs(af_municipality_concept_id);

-- 4) Kommentar
COMMENT ON COLUMN jobs.af_municipality_concept_id IS 'AF Taxonomy concept_id for municipality - used directly in AF API calls';