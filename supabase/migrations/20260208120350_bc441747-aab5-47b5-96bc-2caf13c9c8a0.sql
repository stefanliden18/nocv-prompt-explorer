-- Create requirement_templates table for structured requirement profiles per role
CREATE TABLE public.requirement_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique index on role_key for active templates
CREATE UNIQUE INDEX idx_requirement_templates_role_key_active 
ON public.requirement_templates(role_key) 
WHERE is_active = true;

-- Add updated_at trigger
CREATE TRIGGER update_requirement_templates_updated_at
BEFORE UPDATE ON public.requirement_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.requirement_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SELECT: All authenticated users can view templates
CREATE POLICY "Authenticated users can view templates"
ON public.requirement_templates
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- INSERT: Only admins
CREATE POLICY "Admins can insert templates"
ON public.requirement_templates
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- UPDATE: Only admins
CREATE POLICY "Admins can update templates"
ON public.requirement_templates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- DELETE: Only admins
CREATE POLICY "Admins can delete templates"
ON public.requirement_templates
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add requirement_profile column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN requirement_profile JSONB DEFAULT NULL;