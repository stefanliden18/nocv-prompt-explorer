-- Migrate data from old taxonomy tables to af_taxonomy
-- Handle duplicates and NULL concept_ids properly

-- Clear existing data in af_taxonomy
DELETE FROM af_taxonomy;

-- Migrate occupation codes (occupation-name)
INSERT INTO af_taxonomy (concept_id, type, version, code, label, lang, updated_at)
SELECT 
  code as concept_id,
  'occupation-name' as type,
  1 as version,
  ssyk_code as code,
  label_sv as label,
  'sv' as lang,
  now() as updated_at
FROM af_occupation_codes;

-- Migrate municipality codes
-- Use DISTINCT ON to handle duplicate concept_ids, take first by code
-- For NULL concept_ids, use code as concept_id
INSERT INTO af_taxonomy (concept_id, type, version, code, label, lang, updated_at)
SELECT DISTINCT ON (COALESCE(concept_id, code))
  COALESCE(concept_id, code) as concept_id,
  'municipality' as type,
  1 as version,
  code,
  label,
  'sv' as lang,
  now() as updated_at
FROM af_municipality_codes
ORDER BY COALESCE(concept_id, code), code;

-- Migrate employment type codes
INSERT INTO af_taxonomy (concept_id, type, version, code, label, lang, updated_at)
SELECT 
  code as concept_id,
  'employment-type' as type,
  1 as version,
  NULL as code,
  label,
  'sv' as lang,
  now() as updated_at
FROM af_employment_type_codes;

-- Migrate duration codes
INSERT INTO af_taxonomy (concept_id, type, version, code, label, lang, updated_at)
SELECT 
  code as concept_id,
  'duration' as type,
  1 as version,
  NULL as code,
  label,
  'sv' as lang,
  now() as updated_at
FROM af_duration_codes;

-- Migrate worktime extent codes
INSERT INTO af_taxonomy (concept_id, type, version, code, label, lang, updated_at)
SELECT 
  code as concept_id,
  'worktime-extent' as type,
  1 as version,
  NULL as code,
  label,
  'sv' as lang,
  now() as updated_at
FROM af_worktime_extent_codes;