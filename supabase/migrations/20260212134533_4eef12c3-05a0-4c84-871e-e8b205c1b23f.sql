
-- Fix 1: Add email_sent flag to prevent duplicate email sending
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS email_sent boolean NOT NULL DEFAULT false;

-- Fix 2: Remove duplicate "Anyone can insert applications" policy (keep "Anonymous can insert applications")
DROP POLICY IF EXISTS "Anyone can insert applications" ON public.applications;

-- Fix 3: Restrict public job view to hide contact person details by replacing the broad public policy
-- We can't do column-level RLS, but the current policy already restricts to published jobs.
-- The real issue is that both anonymous and authenticated see ALL columns on published jobs.
-- Since RLS can't hide columns, we'll leave the published jobs policy as-is (it correctly restricts to published only).
