-- Allow anonymous users to view company basic info (name and logo)
-- This is needed so company logos appear on public job listings
CREATE POLICY "Public can view company basic info"
ON companies
FOR SELECT
TO anon
USING (true);