-- Migration: Clean up invalid concept_ids from jobs table
-- This ensures all jobs only have concept_ids that exist in the current af_taxonomy

-- 1. Clean occupation-name (version 16)
UPDATE jobs
SET af_occupation_cid = NULL
WHERE af_occupation_cid IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM af_taxonomy 
  WHERE concept_id = jobs.af_occupation_cid 
  AND type = 'occupation-name' 
  AND version = 16
);

-- 2. Clean municipality (version 1)
UPDATE jobs
SET af_municipality_cid = NULL
WHERE af_municipality_cid IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM af_taxonomy 
  WHERE concept_id = jobs.af_municipality_cid 
  AND type = 'municipality' 
  AND version = 1
);

-- 3. Clean employment-type (version 1)
UPDATE jobs
SET af_employment_type_cid = NULL
WHERE af_employment_type_cid IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM af_taxonomy 
  WHERE concept_id = jobs.af_employment_type_cid 
  AND type = 'employment-type' 
  AND version = 1
);

-- 4. Clean duration (version 1)
UPDATE jobs
SET af_duration_cid = NULL
WHERE af_duration_cid IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM af_taxonomy 
  WHERE concept_id = jobs.af_duration_cid 
  AND type = 'employment-duration' 
  AND version = 1
);

-- 5. Clean worktime-extent (version 16)
UPDATE jobs
SET af_worktime_extent_cid = NULL
WHERE af_worktime_extent_cid IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM af_taxonomy 
  WHERE concept_id = jobs.af_worktime_extent_cid 
  AND type = 'worktime-extent' 
  AND version = 16
);