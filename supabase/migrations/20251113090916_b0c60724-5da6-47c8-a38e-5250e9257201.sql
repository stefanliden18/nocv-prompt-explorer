-- Ta bort AF-triggers
DROP TRIGGER IF EXISTS trigger_sync_af_on_job_update ON jobs;
DROP TRIGGER IF EXISTS trigger_unpublish_af_on_archive ON jobs;

-- Ta bort trigger-funktioner
DROP FUNCTION IF EXISTS public.sync_af_on_job_update();
DROP FUNCTION IF EXISTS public.unpublish_af_on_archive();

-- Ta bort AF-kolumner från jobs-tabellen
ALTER TABLE jobs 
  DROP COLUMN IF EXISTS af_published,
  DROP COLUMN IF EXISTS af_ad_id,
  DROP COLUMN IF EXISTS af_published_at,
  DROP COLUMN IF EXISTS af_last_sync,
  DROP COLUMN IF EXISTS af_error,
  DROP COLUMN IF EXISTS af_occupation_cid,
  DROP COLUMN IF EXISTS af_municipality_cid,
  DROP COLUMN IF EXISTS af_employment_type_cid,
  DROP COLUMN IF EXISTS af_duration_cid,
  DROP COLUMN IF EXISTS af_worktime_extent_cid,
  DROP COLUMN IF EXISTS af_wage_type_code;

-- Ta bort af_taxonomy-tabellen
DROP TABLE IF EXISTS af_taxonomy;