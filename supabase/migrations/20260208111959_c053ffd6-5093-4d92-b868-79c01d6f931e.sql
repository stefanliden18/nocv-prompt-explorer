-- =============================================
-- KANDIDATPRESENTATION - TVÅSTEGS AI-MATCHNING
-- =============================================

-- Enum for interview types
CREATE TYPE interview_type AS ENUM ('screening', 'full_interview');

-- Enum for assessment types
CREATE TYPE assessment_type AS ENUM ('screening', 'final');

-- Enum for screening recommendations
CREATE TYPE screening_recommendation AS ENUM ('proceed', 'maybe', 'reject');

-- Enum for presentation status
CREATE TYPE presentation_status AS ENUM ('draft', 'published', 'archived');

-- =============================================
-- TABLE 1: role_profiles
-- Fördefinierade kravprofiler för yrkesroller
-- =============================================
CREATE TABLE public.role_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  technical_skills jsonb DEFAULT '[]'::jsonb,
  soft_skills jsonb DEFAULT '[]'::jsonb,
  knowledge_areas jsonb DEFAULT '[]'::jsonb,
  screening_criteria jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_profiles ENABLE ROW LEVEL SECURITY;

-- Policies: All authenticated can read, only admins can modify
CREATE POLICY "Anyone can view role profiles"
  ON public.role_profiles FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert role profiles"
  ON public.role_profiles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update role profiles"
  ON public.role_profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete role profiles"
  ON public.role_profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TABLE 2: candidate_transcripts
-- Transkriberade intervjusvar
-- =============================================
CREATE TABLE public.candidate_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  interview_type interview_type NOT NULL,
  transcript_text text NOT NULL,
  structured_data jsonb,
  source text DEFAULT 'manual',
  imported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidate_transcripts ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can do everything, job creators can view/write for their applications
CREATE POLICY "Admins can view all transcripts"
  ON public.candidate_transcripts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Job creators can view transcripts for their applications"
  ON public.candidate_transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      WHERE a.id = candidate_transcripts.application_id
      AND j.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can insert transcripts"
  ON public.candidate_transcripts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Job creators can insert transcripts for their applications"
  ON public.candidate_transcripts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      WHERE a.id = application_id
      AND j.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can update transcripts"
  ON public.candidate_transcripts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Job creators can update transcripts for their applications"
  ON public.candidate_transcripts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      WHERE a.id = candidate_transcripts.application_id
      AND j.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can delete transcripts"
  ON public.candidate_transcripts FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TABLE 3: candidate_assessments
-- AI-genererade bedömningar
-- =============================================
CREATE TABLE public.candidate_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  transcript_id uuid NOT NULL REFERENCES public.candidate_transcripts(id) ON DELETE CASCADE,
  role_profile_id uuid NOT NULL REFERENCES public.role_profiles(id),
  assessment_type assessment_type NOT NULL,
  match_score integer CHECK (match_score >= 0 AND match_score <= 100),
  role_match_score integer CHECK (role_match_score >= 0 AND role_match_score <= 100),
  job_match_score integer CHECK (job_match_score >= 0 AND job_match_score <= 100),
  recommendation screening_recommendation,
  strengths jsonb DEFAULT '[]'::jsonb,
  concerns jsonb DEFAULT '[]'::jsonb,
  technical_assessment text,
  soft_skills_assessment text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Unique constraint: one assessment per transcript
  UNIQUE (transcript_id, assessment_type)
);

-- Enable RLS
ALTER TABLE public.candidate_assessments ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can do everything, job creators can view/write for their applications
CREATE POLICY "Admins can view all assessments"
  ON public.candidate_assessments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Job creators can view assessments for their applications"
  ON public.candidate_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      WHERE a.id = candidate_assessments.application_id
      AND j.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can insert assessments"
  ON public.candidate_assessments FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Job creators can insert assessments for their applications"
  ON public.candidate_assessments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      WHERE a.id = application_id
      AND j.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can update assessments"
  ON public.candidate_assessments FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Job creators can update assessments for their applications"
  ON public.candidate_assessments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      WHERE a.id = candidate_assessments.application_id
      AND j.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can delete assessments"
  ON public.candidate_assessments FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TABLE 4: candidate_presentations
-- Publicerbara kundpresentationer
-- =============================================
CREATE TABLE public.candidate_presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  final_assessment_id uuid NOT NULL REFERENCES public.candidate_assessments(id) ON DELETE CASCADE,
  presentation_html text,
  status presentation_status NOT NULL DEFAULT 'draft',
  share_token text UNIQUE,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidate_presentations ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can do everything, job creators can view for their applications, public access via token
CREATE POLICY "Admins can view all presentations"
  ON public.candidate_presentations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Job creators can view presentations for their applications"
  ON public.candidate_presentations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      WHERE a.id = candidate_presentations.application_id
      AND j.created_by = auth.uid()
    )
  );

CREATE POLICY "Public can view published presentations via token"
  ON public.candidate_presentations FOR SELECT
  USING (
    status = 'published' AND share_token IS NOT NULL
  );

CREATE POLICY "Admins can insert presentations"
  ON public.candidate_presentations FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Job creators can insert presentations for their applications"
  ON public.candidate_presentations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      WHERE a.id = application_id
      AND j.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can update presentations"
  ON public.candidate_presentations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Job creators can update presentations for their applications"
  ON public.candidate_presentations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      WHERE a.id = candidate_presentations.application_id
      AND j.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can delete presentations"
  ON public.candidate_presentations FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGERS: Update timestamps
-- =============================================
CREATE TRIGGER update_role_profiles_updated_at
  BEFORE UPDATE ON public.role_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidate_assessments_updated_at
  BEFORE UPDATE ON public.candidate_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidate_presentations_updated_at
  BEFORE UPDATE ON public.candidate_presentations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();