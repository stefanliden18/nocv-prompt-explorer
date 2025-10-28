-- Drop old legacy tables that are no longer needed
DROP TABLE IF EXISTS public.af_occupation_codes CASCADE;
DROP TABLE IF EXISTS public.af_municipality_codes CASCADE;
DROP TABLE IF EXISTS public.af_employment_type_codes CASCADE;
DROP TABLE IF EXISTS public.af_duration_codes CASCADE;
DROP TABLE IF EXISTS public.af_worktime_extent_codes CASCADE;

-- Update af_taxonomy table to remove unused columns
ALTER TABLE public.af_taxonomy DROP COLUMN IF EXISTS legacy_id;
ALTER TABLE public.af_taxonomy DROP COLUMN IF EXISTS code;
ALTER TABLE public.af_taxonomy DROP COLUMN IF EXISTS lang;

-- Update jobs table to remove _code suffix columns
ALTER TABLE public.jobs DROP COLUMN IF EXISTS af_occupation_code;
ALTER TABLE public.jobs DROP COLUMN IF EXISTS af_municipality_code;
ALTER TABLE public.jobs DROP COLUMN IF EXISTS af_employment_type_code;
ALTER TABLE public.jobs DROP COLUMN IF EXISTS af_duration_code;
ALTER TABLE public.jobs DROP COLUMN IF EXISTS af_worktime_extent_code;