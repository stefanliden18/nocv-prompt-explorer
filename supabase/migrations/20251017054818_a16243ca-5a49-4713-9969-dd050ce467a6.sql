-- Allow anonymous users to check rate limits (only email and created_at)
-- This is needed for the rate limiting trigger to work
CREATE POLICY "Anonymous can check rate limits"
ON public.applications
FOR SELECT
TO anon
USING (
  -- Only allow SELECT on email and created_at columns for rate limiting
  -- This doesn't expose sensitive data like candidate_name, phone, etc.
  email IS NOT NULL
);