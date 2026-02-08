-- Create table for saved requirement profiles
CREATE TABLE public.saved_requirement_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES requirement_templates(id) ON DELETE CASCADE,
  
  -- Customer information
  company_name TEXT NOT NULL,
  contact_person TEXT,
  desired_start_date TEXT,
  salary_range TEXT,
  
  -- Profile data (JSON)
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  section_notes JSONB DEFAULT '{}'::jsonb,
  
  -- Status - linked to job if not null
  linked_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_requirement_profiles ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_saved_requirement_profiles_updated_at
BEFORE UPDATE ON public.saved_requirement_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Admins can view all profiles
CREATE POLICY "Admins can view all saved profiles"
ON public.saved_requirement_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert profiles
CREATE POLICY "Admins can insert saved profiles"
ON public.saved_requirement_profiles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update all profiles
CREATE POLICY "Admins can update all saved profiles"
ON public.saved_requirement_profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete all profiles
CREATE POLICY "Admins can delete all saved profiles"
ON public.saved_requirement_profiles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Creators can view their own profiles
CREATE POLICY "Users can view their own saved profiles"
ON public.saved_requirement_profiles
FOR SELECT
USING (auth.uid() = created_by);

-- Creators can insert their own profiles
CREATE POLICY "Users can insert their own saved profiles"
ON public.saved_requirement_profiles
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Creators can update their own profiles
CREATE POLICY "Users can update their own saved profiles"
ON public.saved_requirement_profiles
FOR UPDATE
USING (auth.uid() = created_by);

-- Creators can delete their own profiles
CREATE POLICY "Users can delete their own saved profiles"
ON public.saved_requirement_profiles
FOR DELETE
USING (auth.uid() = created_by);