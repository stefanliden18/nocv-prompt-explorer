-- Add SET search_path = public to database functions for security

-- 1. Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. Update update_page_content_updated_at function
CREATE OR REPLACE FUNCTION public.update_page_content_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 3. Update sync_application_status function
CREATE OR REPLACE FUNCTION public.sync_application_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.status := CASE
    WHEN NEW.pipeline_stage_id IN (SELECT id FROM pipeline_stages WHERE name = 'Ny ansökan') 
      THEN 'new'::application_status
    WHEN NEW.pipeline_stage_id IN (SELECT id FROM pipeline_stages WHERE name = 'Granskning') 
      THEN 'viewed'::application_status
    WHEN NEW.pipeline_stage_id IN (SELECT id FROM pipeline_stages WHERE name LIKE 'Intervju%') 
      THEN 'booked'::application_status
    WHEN NEW.pipeline_stage_id IN (SELECT id FROM pipeline_stages WHERE name = 'Avvisad') 
      THEN 'rejected'::application_status
    ELSE NEW.status
  END;
  
  RETURN NEW;
END;
$function$;