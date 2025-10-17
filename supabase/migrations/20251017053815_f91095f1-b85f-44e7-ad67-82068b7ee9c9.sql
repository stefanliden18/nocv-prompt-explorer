-- Rate limiting: 1 ansökan / 10 min och max 10 per dygn per e-post
CREATE OR REPLACE FUNCTION public.enforce_application_limits(p_email text)
RETURNS void LANGUAGE plpgsql AS $$
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

-- Trigger function
CREATE OR REPLACE FUNCTION public.applications_before_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.enforce_application_limits(NEW.email);
  RETURN NEW;
END $$;

-- Add trigger
DROP TRIGGER IF EXISTS trg_applications_before_insert ON public.applications;
CREATE TRIGGER trg_applications_before_insert
BEFORE INSERT ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.applications_before_insert();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS applications_email_idx ON public.applications (email);
CREATE INDEX IF NOT EXISTS applications_created_idx ON public.applications (created_at);

-- Allow anonymous users to insert applications (with rate limiting via trigger)
DROP POLICY IF EXISTS "Anonymous can insert applications" ON public.applications;
CREATE POLICY "Anonymous can insert applications"
ON public.applications
FOR INSERT
TO anon
WITH CHECK (true);