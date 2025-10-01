-- Update functions to have proper search_path set
CREATE OR REPLACE FUNCTION public.is_job_published(job public.jobs)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  SELECT job.status = 'published' 
    AND (job.publish_at IS NULL OR job.publish_at <= now())
$$;