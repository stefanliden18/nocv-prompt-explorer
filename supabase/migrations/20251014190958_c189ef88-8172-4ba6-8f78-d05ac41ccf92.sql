-- Drop befintliga policies
DROP POLICY IF EXISTS "Public can view published jobs" ON public.jobs;

-- Skapa ny policy som använder Stockholm-tid för jämförelse
CREATE POLICY "Public can view published jobs"
  ON public.jobs FOR SELECT
  USING (
    status = 'published' 
    AND (
      publish_at IS NULL 
      OR publish_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Stockholm' <= now() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Stockholm'
    )
  );

-- Uppdatera is_job_published() funktionen
CREATE OR REPLACE FUNCTION public.is_job_published(job public.jobs)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  SELECT job.status = 'published' 
    AND (
      job.publish_at IS NULL 
      OR job.publish_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Stockholm' <= now() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Stockholm'
    )
$$;