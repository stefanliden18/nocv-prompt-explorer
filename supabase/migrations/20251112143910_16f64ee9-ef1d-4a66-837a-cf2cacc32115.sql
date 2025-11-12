-- Allow anyone (including anonymous users) to view demo jobs
CREATE POLICY "Anyone can view demo jobs"
ON public.jobs
FOR SELECT
TO public
USING (status = 'demo');