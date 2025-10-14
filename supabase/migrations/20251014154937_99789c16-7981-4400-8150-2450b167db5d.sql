-- Add kiku_interview_url column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN kiku_interview_url text;