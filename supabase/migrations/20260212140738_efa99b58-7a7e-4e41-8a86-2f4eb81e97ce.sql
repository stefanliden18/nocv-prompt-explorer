-- Restore permissive INSERT policy for applications
-- Anyone (anonymous or authenticated) should be able to apply for jobs
CREATE POLICY "Anyone can insert applications"
  ON public.applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);