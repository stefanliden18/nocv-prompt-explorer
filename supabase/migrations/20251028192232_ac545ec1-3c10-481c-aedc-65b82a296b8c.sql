-- Fix trigger function to use new _cid column names instead of old _code names
CREATE OR REPLACE FUNCTION public.sync_af_on_job_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.af_published = true AND (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.description_md IS DISTINCT FROM NEW.description_md OR
    OLD.contact_person_name IS DISTINCT FROM NEW.contact_person_name OR
    OLD.contact_person_email IS DISTINCT FROM NEW.contact_person_email OR
    OLD.contact_person_phone IS DISTINCT FROM NEW.contact_person_phone OR
    OLD.last_application_date IS DISTINCT FROM NEW.last_application_date OR
    OLD.af_occupation_cid IS DISTINCT FROM NEW.af_occupation_cid OR
    OLD.af_municipality_cid IS DISTINCT FROM NEW.af_municipality_cid OR
    OLD.af_employment_type_cid IS DISTINCT FROM NEW.af_employment_type_cid OR
    OLD.af_duration_cid IS DISTINCT FROM NEW.af_duration_cid OR
    OLD.af_worktime_extent_cid IS DISTINCT FROM NEW.af_worktime_extent_cid
  ) THEN
    RAISE NOTICE 'Job % needs AF sync - fields changed', NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;