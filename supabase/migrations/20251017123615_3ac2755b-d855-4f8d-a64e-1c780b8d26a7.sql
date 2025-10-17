-- Fix search_path for remaining trigger functions

-- Fix unpublish_af_on_archive function
CREATE OR REPLACE FUNCTION public.unpublish_af_on_archive()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'archived' AND OLD.status != 'archived' AND NEW.af_published = true THEN
    RAISE NOTICE 'Job % archived - should unpublish from AF', NEW.id;
    PERFORM pg_notify('unpublish_af', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix sync_af_on_job_update function
CREATE OR REPLACE FUNCTION public.sync_af_on_job_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

-- Fix is_job_published function (computed column)
CREATE OR REPLACE FUNCTION public.is_job_published(job jobs)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  SELECT job.status = 'published' 
    AND (
      job.publish_at IS NULL 
      OR job.publish_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Stockholm' <= now() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Stockholm'
    )
$function$;