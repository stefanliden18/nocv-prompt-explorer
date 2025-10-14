-- Add rating column to applications table
ALTER TABLE public.applications 
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Create application_tags table
CREATE TABLE public.application_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create application_tag_relations table (many-to-many)
CREATE TABLE public.application_tag_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.application_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(application_id, tag_id)
);

-- Enable RLS on new tables
ALTER TABLE public.application_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_tag_relations ENABLE ROW LEVEL SECURITY;

-- RLS policies for application_tags
CREATE POLICY "Admins can view all tags"
ON public.application_tags
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert tags"
ON public.application_tags
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tags"
ON public.application_tags
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tags"
ON public.application_tags
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for application_tag_relations
CREATE POLICY "Admins can view all tag relations"
ON public.application_tag_relations
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert tag relations"
ON public.application_tag_relations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tag relations"
ON public.application_tag_relations
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Job creators can view tag relations for their applications
CREATE POLICY "Job creators can view tag relations for their applications"
ON public.application_tag_relations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.jobs j ON a.job_id = j.id
    WHERE a.id = application_tag_relations.application_id
      AND j.created_by = auth.uid()
  )
);