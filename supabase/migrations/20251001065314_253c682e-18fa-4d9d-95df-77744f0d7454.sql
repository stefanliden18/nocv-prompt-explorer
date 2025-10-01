-- Drop existing jobs policies
DROP POLICY IF EXISTS "Anyone can view published jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters and admins can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can delete jobs" ON public.jobs;

-- Drop existing applications policies
DROP POLICY IF EXISTS "Recruiters and admins can view applications" ON public.applications;
DROP POLICY IF EXISTS "Recruiters can update application status" ON public.applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;

-- Create function to check if job is publicly viewable
CREATE OR REPLACE FUNCTION public.is_job_published(job public.jobs)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT job.status = 'published' 
    AND (job.publish_at IS NULL OR job.publish_at <= now())
$$;

-- Create function to check if user created the job
CREATE OR REPLACE FUNCTION public.is_job_creator(_user_id UUID, _job_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE id = _job_id
      AND created_by = _user_id
  )
$$;

-- Create function to check if user can access application (creator of the job or admin)
CREATE OR REPLACE FUNCTION public.can_access_application(_user_id UUID, _application_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.jobs j ON a.job_id = j.id
    WHERE a.id = _application_id
      AND (j.created_by = _user_id OR public.has_role(_user_id, 'admin'))
  )
$$;

-- Jobs RLS Policies
-- Public: Only published jobs where publish_at has passed or is null
CREATE POLICY "Public can view published jobs"
  ON public.jobs FOR SELECT
  USING (
    status = 'published' 
    AND (publish_at IS NULL OR publish_at <= now())
  );

-- Creators can view their own jobs (any status)
CREATE POLICY "Creators can view their own jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Admins can view all jobs
CREATE POLICY "Admins can view all jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Recruiters and admins can insert jobs
CREATE POLICY "Recruiters and admins can insert jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_recruiter_or_admin(auth.uid()) 
    AND created_by = auth.uid()
  );

-- Creators can update their own jobs
CREATE POLICY "Creators can update their own jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Admins can update all jobs
CREATE POLICY "Admins can update all jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Creators can delete their own jobs (for archiving)
CREATE POLICY "Creators can delete their own jobs"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Admins can delete all jobs
CREATE POLICY "Admins can delete all jobs"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Applications RLS Policies
-- Job creators can view applications to their jobs
CREATE POLICY "Job creators can view applications to their jobs"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.jobs
      WHERE jobs.id = applications.job_id
        AND jobs.created_by = auth.uid()
    )
  );

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Job creators can update applications to their jobs
CREATE POLICY "Job creators can update applications to their jobs"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.jobs
      WHERE jobs.id = applications.job_id
        AND jobs.created_by = auth.uid()
    )
  );

-- Admins can update all applications
CREATE POLICY "Admins can update all applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete applications
CREATE POLICY "Admins can delete all applications"
  ON public.applications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));