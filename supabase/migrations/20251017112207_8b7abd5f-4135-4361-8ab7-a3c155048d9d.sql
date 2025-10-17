-- ===================================================================
-- FIX: Sätt search_path för AF trigger-funktioner (säkerhetsfix)
-- ===================================================================

-- Uppdatera sync_af_on_job_update med search_path
CREATE OR REPLACE FUNCTION sync_af_on_job_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Om jobbet är publicerat på AF och något viktigt ändras
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
$$;

-- Uppdatera unpublish_af_on_archive med search_path
CREATE OR REPLACE FUNCTION unpublish_af_on_archive()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Om jobbet arkiveras och är publicerat på AF
  IF NEW.status = 'archived' AND OLD.status != 'archived' AND NEW.af_published = true THEN
    RAISE NOTICE 'Job % archived - should unpublish from AF', NEW.id;
    -- Här kan man lägga till pg_notify för att trigga Edge Function
    PERFORM pg_notify('unpublish_af', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$;