-- Fix search_path for remaining logging functions

-- 1. Update log_job_event function
CREATE OR REPLACE FUNCTION public.log_job_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  event_type_value TEXT;
BEGIN
  -- Determine event type
  IF (TG_OP = 'INSERT') THEN
    event_type_value := 'job_created';
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Check if status changed to published
    IF (OLD.status != 'published' AND NEW.status = 'published') THEN
      event_type_value := 'job_published';
    ELSE
      event_type_value := 'job_updated';
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Insert activity log
  INSERT INTO public.activity_logs (
    event_type,
    entity_type,
    entity_id,
    user_id,
    metadata
  ) VALUES (
    event_type_value,
    'job',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.created_by, OLD.created_by),
    jsonb_build_object(
      'title', COALESCE(NEW.title, OLD.title),
      'status', COALESCE(NEW.status, OLD.status),
      'company_id', COALESCE(NEW.company_id, OLD.company_id)
    )
  );

  RETURN NEW;
END;
$function$;

-- 2. Update log_application_event function
CREATE OR REPLACE FUNCTION public.log_application_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  event_type_value TEXT;
BEGIN
  -- Determine event type
  IF (TG_OP = 'INSERT') THEN
    event_type_value := 'application_submitted';
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    event_type_value := 'application_status_changed';
  ELSE
    RETURN NEW;
  END IF;

  -- Insert activity log
  INSERT INTO public.activity_logs (
    event_type,
    entity_type,
    entity_id,
    user_id,
    metadata
  ) VALUES (
    event_type_value,
    'application',
    NEW.id,
    NULL, -- Applications don't have a user_id in auth
    jsonb_build_object(
      'job_id', NEW.job_id,
      'candidate_name', NEW.candidate_name,
      'email', NEW.email,
      'status', NEW.status,
      'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END
    )
  );

  RETURN NEW;
END;
$function$;