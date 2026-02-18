-- Add presentation_id to portal_candidates
ALTER TABLE public.portal_candidates
ADD COLUMN presentation_id uuid REFERENCES public.candidate_presentations(id) ON DELETE SET NULL;

-- Create index for lookups
CREATE INDEX idx_portal_candidates_presentation_id ON public.portal_candidates(presentation_id);