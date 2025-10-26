-- Fix existing jobs: Convert municipality code to concept_id and clean invalid worktime extent values

-- Update af_municipality_cid from code to concept_id by looking up in af_taxonomy
UPDATE jobs
SET af_municipality_cid = (
  SELECT concept_id 
  FROM af_taxonomy 
  WHERE type = 'municipality' 
    AND code = jobs.af_municipality_code
  LIMIT 1
)
WHERE af_municipality_code IS NOT NULL
  AND af_municipality_cid IS NULL;

-- Clear invalid af_worktime_extent_cid values that don't exist in taxonomy
UPDATE jobs
SET af_worktime_extent_cid = NULL
WHERE af_worktime_extent_cid IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM af_taxonomy 
    WHERE concept_id = jobs.af_worktime_extent_cid 
      AND type = 'worktime-extent'
  );

-- Update af_occupation_cid from old code if needed
UPDATE jobs
SET af_occupation_cid = (
  SELECT concept_id 
  FROM af_taxonomy 
  WHERE type = 'occupation-name' 
    AND code = jobs.af_occupation_code
  LIMIT 1
)
WHERE af_occupation_code IS NOT NULL
  AND af_occupation_cid IS NULL;

-- Update af_employment_type_cid from old code if needed
UPDATE jobs
SET af_employment_type_cid = (
  SELECT concept_id 
  FROM af_taxonomy 
  WHERE type = 'employment-type' 
    AND concept_id = jobs.af_employment_type_code
  LIMIT 1
)
WHERE af_employment_type_code IS NOT NULL
  AND af_employment_type_cid IS NULL;

-- Update af_duration_cid from old code if needed
UPDATE jobs
SET af_duration_cid = (
  SELECT concept_id 
  FROM af_taxonomy 
  WHERE type = 'duration' 
    AND concept_id = jobs.af_duration_code
  LIMIT 1
)
WHERE af_duration_code IS NOT NULL
  AND af_duration_cid IS NULL;