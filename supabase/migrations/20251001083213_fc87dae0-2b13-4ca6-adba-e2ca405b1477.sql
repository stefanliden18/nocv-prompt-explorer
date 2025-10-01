-- Update SELECT policy for companies table to only allow admin/recruiter
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;

CREATE POLICY "Admin and recruiters can view companies"
ON public.companies
FOR SELECT
TO authenticated
USING (is_recruiter_or_admin(auth.uid()));