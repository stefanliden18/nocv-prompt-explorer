
-- Create portal_interview_proposals table
CREATE TABLE public.portal_interview_proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id uuid NOT NULL REFERENCES public.portal_candidates(id) ON DELETE CASCADE,
  company_user_id uuid NOT NULL REFERENCES public.company_users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  respond_token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex') UNIQUE,
  option_1_at timestamptz NOT NULL,
  option_2_at timestamptz NOT NULL,
  chosen_option integer,
  duration_minutes integer NOT NULL DEFAULT 30,
  location_type text NOT NULL DEFAULT 'onsite',
  location_details text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

-- Enable RLS
ALTER TABLE public.portal_interview_proposals ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can view all proposals"
  ON public.portal_interview_proposals FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert proposals"
  ON public.portal_interview_proposals FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update proposals"
  ON public.portal_interview_proposals FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete proposals"
  ON public.portal_interview_proposals FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Company users can create/view/update their own
CREATE POLICY "Company users can insert proposals"
  ON public.portal_interview_proposals FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.id = portal_interview_proposals.company_user_id
    AND cu.user_id = auth.uid()
  ));

CREATE POLICY "Company users can view proposals"
  ON public.portal_interview_proposals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.id = portal_interview_proposals.company_user_id
    AND cu.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Company users can update proposals"
  ON public.portal_interview_proposals FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.id = portal_interview_proposals.company_user_id
    AND cu.user_id = auth.uid()
  ));

-- Public access via respond_token (for candidate response page)
CREATE POLICY "Public can view proposal by token"
  ON public.portal_interview_proposals FOR SELECT
  USING (respond_token IS NOT NULL);

-- Public can update proposal status via token (for accepting)
CREATE POLICY "Public can respond to proposal by token"
  ON public.portal_interview_proposals FOR UPDATE
  USING (respond_token IS NOT NULL AND status = 'pending');
