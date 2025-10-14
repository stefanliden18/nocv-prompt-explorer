-- Add notes column to applications table
ALTER TABLE public.applications 
ADD COLUMN notes TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.applications.notes IS 'Internal notes about the candidate/application for recruiters and admins';