-- Create enum for job status
CREATE TYPE public.job_status AS ENUM ('draft', 'published', 'archived');

-- Create enum for application status
CREATE TYPE public.application_status AS ENUM ('new', 'viewed', 'booked', 'rejected');

-- Create enum for profile role (extends existing app_role)
CREATE TYPE public.profile_role AS ENUM ('recruiter', 'admin', 'user');

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role public.profile_role NOT NULL DEFAULT 'user';

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  city TEXT,
  region TEXT,
  category TEXT,
  employment_type TEXT,
  description_md TEXT,
  requirements_md TEXT,
  driver_license BOOLEAN DEFAULT false,
  language TEXT,
  status public.job_status NOT NULL DEFAULT 'draft',
  publish_at TIMESTAMP WITH TIME ZONE,
  slug TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  cv_url TEXT,
  status public.application_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is recruiter or admin
CREATE OR REPLACE FUNCTION public.is_recruiter_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role IN ('recruiter', 'admin')
  )
$$;

-- Companies RLS Policies
CREATE POLICY "Anyone can view companies"
  ON public.companies FOR SELECT
  USING (true);

CREATE POLICY "Recruiters and admins can insert companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (public.is_recruiter_or_admin(auth.uid()));

CREATE POLICY "Recruiters and admins can update companies"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (public.is_recruiter_or_admin(auth.uid()));

CREATE POLICY "Admins can delete companies"
  ON public.companies FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Jobs RLS Policies
CREATE POLICY "Anyone can view published jobs"
  ON public.jobs FOR SELECT
  USING (status = 'published' OR public.is_recruiter_or_admin(auth.uid()));

CREATE POLICY "Recruiters and admins can insert jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_recruiter_or_admin(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Recruiters can update their own jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete jobs"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Applications RLS Policies
CREATE POLICY "Anyone can insert applications"
  ON public.applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Recruiters and admins can view applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (public.is_recruiter_or_admin(auth.uid()));

CREATE POLICY "Recruiters can update application status"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (public.is_recruiter_or_admin(auth.uid()));

CREATE POLICY "Admins can delete applications"
  ON public.applications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_slug ON public.jobs(slug);
CREATE INDEX idx_jobs_created_by ON public.jobs(created_by);
CREATE INDEX idx_applications_job_id ON public.applications(job_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();