-- Add 'demo' status to job_status enum
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'demo';

-- Add is_demo column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_is_demo ON applications(is_demo);

-- Create trigger function to automatically mark demo applications
CREATE OR REPLACE FUNCTION mark_demo_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the job is a demo job
  IF EXISTS (
    SELECT 1 FROM jobs 
    WHERE id = NEW.job_id 
    AND status = 'demo'
  ) THEN
    NEW.is_demo := true;
  ELSE
    NEW.is_demo := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on applications table
DROP TRIGGER IF EXISTS set_demo_application ON applications;
CREATE TRIGGER set_demo_application
  BEFORE INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION mark_demo_application();