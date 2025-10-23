-- Add worktime extent code column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN af_worktime_extent_code text;

-- Create table for AF worktime extent codes
CREATE TABLE public.af_worktime_extent_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  code text NOT NULL UNIQUE,
  label text NOT NULL
);

-- Enable RLS
ALTER TABLE public.af_worktime_extent_codes ENABLE ROW LEVEL SECURITY;

-- Policies for worktime extent codes
CREATE POLICY "Authenticated users can read worktime extent codes"
  ON public.af_worktime_extent_codes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage worktime extent codes"
  ON public.af_worktime_extent_codes
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert common worktime extent values
INSERT INTO public.af_worktime_extent_codes (code, label) VALUES
  ('HEL', 'Heltid'),
  ('DEL', 'Deltid')
ON CONFLICT (code) DO NOTHING;