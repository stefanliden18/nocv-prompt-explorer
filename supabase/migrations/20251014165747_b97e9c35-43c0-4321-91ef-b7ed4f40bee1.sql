-- Create pipeline_stages table
CREATE TABLE public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  display_order INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster sorting
CREATE INDEX idx_pipeline_stages_order ON public.pipeline_stages(display_order);

-- Insert default stages
INSERT INTO public.pipeline_stages (name, color, display_order, is_default) VALUES
  ('Ny ansökan', '#3b82f6', 1, true),
  ('Granskning', '#f59e0b', 2, true),
  ('Intervju bokad', '#10b981', 3, true),
  ('Intervju genomförd', '#8b5cf6', 4, true),
  ('Erbjudande', '#06b6d4', 5, true),
  ('Avvisad', '#ef4444', 6, true);

-- Add pipeline_stage_id to applications
ALTER TABLE public.applications 
ADD COLUMN pipeline_stage_id UUID REFERENCES public.pipeline_stages(id);

-- Migrate existing data
UPDATE public.applications 
SET pipeline_stage_id = (
  SELECT id FROM public.pipeline_stages 
  WHERE (applications.status = 'new' AND name = 'Ny ansökan')
     OR (applications.status = 'viewed' AND name = 'Granskning')
     OR (applications.status = 'booked' AND name = 'Intervju bokad')
     OR (applications.status = 'rejected' AND name = 'Avvisad')
  LIMIT 1
);

-- Make column required after migration
ALTER TABLE public.applications 
ALTER COLUMN pipeline_stage_id SET NOT NULL;

-- Enable RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- RLS policies for pipeline_stages
CREATE POLICY "Authenticated users can view pipeline stages"
  ON public.pipeline_stages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert pipeline stages"
  ON public.pipeline_stages FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update pipeline stages"
  ON public.pipeline_stages FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete pipeline stages"
  ON public.pipeline_stages FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_pipeline_stages_updated_at
  BEFORE UPDATE ON public.pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to sync status with pipeline_stage_id
CREATE OR REPLACE FUNCTION sync_application_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status := CASE
    WHEN NEW.pipeline_stage_id IN (SELECT id FROM pipeline_stages WHERE name = 'Ny ansökan') 
      THEN 'new'::application_status
    WHEN NEW.pipeline_stage_id IN (SELECT id FROM pipeline_stages WHERE name = 'Granskning') 
      THEN 'viewed'::application_status
    WHEN NEW.pipeline_stage_id IN (SELECT id FROM pipeline_stages WHERE name LIKE 'Intervju%') 
      THEN 'booked'::application_status
    WHEN NEW.pipeline_stage_id IN (SELECT id FROM pipeline_stages WHERE name = 'Avvisad') 
      THEN 'rejected'::application_status
    ELSE NEW.status
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_status_on_stage_change
  BEFORE UPDATE OF pipeline_stage_id ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION sync_application_status();