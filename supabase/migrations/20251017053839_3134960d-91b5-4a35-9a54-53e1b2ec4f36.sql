-- Fix security warnings: Set search_path for functions
CREATE OR REPLACE FUNCTION public.enforce_application_limits(p_email text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_email IS NULL THEN RETURN; END IF;
  
  -- Check 10-minute limit
  IF EXISTS (
    SELECT 1 FROM public.applications
    WHERE email = p_email 
    AND created_at > now() - interval '10 minutes'
  ) THEN
    RAISE EXCEPTION 'För många försök, vänta minst 10 minuter mellan ansökningar';
  END IF;
  
  -- Check daily limit (24 hours)
  IF (SELECT count(*) FROM public.applications
      WHERE email = p_email 
      AND created_at > now() - interval '1 day') >= 10 THEN
    RAISE EXCEPTION 'Daglig gräns uppnådd (max 10 ansökningar per dag)';
  END IF;
END $$;

-- Trigger function with search_path
CREATE OR REPLACE FUNCTION public.applications_before_insert()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enforce_application_limits(NEW.email);
  RETURN NEW;
END $$;