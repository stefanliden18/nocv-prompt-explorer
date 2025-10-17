-- Allow anonymous users to read pipeline stages (needed for job application form)
CREATE POLICY "Anonymous can view pipeline stages"
ON public.pipeline_stages
FOR SELECT
TO anon
USING (true);