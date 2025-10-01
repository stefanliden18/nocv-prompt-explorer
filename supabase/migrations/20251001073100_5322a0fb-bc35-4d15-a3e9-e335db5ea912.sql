-- Create activity_logs table for tracking events
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to log job events
CREATE OR REPLACE FUNCTION public.log_job_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_type_value TEXT;
BEGIN
  -- Determine event type
  IF (TG_OP = 'INSERT') THEN
    event_type_value := 'job_created';
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Check if status changed to published
    IF (OLD.status != 'published' AND NEW.status = 'published') THEN
      event_type_value := 'job_published';
    ELSE
      event_type_value := 'job_updated';
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Insert activity log
  INSERT INTO public.activity_logs (
    event_type,
    entity_type,
    entity_id,
    user_id,
    metadata
  ) VALUES (
    event_type_value,
    'job',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.created_by, OLD.created_by),
    jsonb_build_object(
      'title', COALESCE(NEW.title, OLD.title),
      'status', COALESCE(NEW.status, OLD.status),
      'company_id', COALESCE(NEW.company_id, OLD.company_id)
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger for job events
CREATE TRIGGER trigger_log_job_events
AFTER INSERT OR UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.log_job_event();

-- Create function to log application events
CREATE OR REPLACE FUNCTION public.log_application_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_type_value TEXT;
BEGIN
  -- Determine event type
  IF (TG_OP = 'INSERT') THEN
    event_type_value := 'application_submitted';
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    event_type_value := 'application_status_changed';
  ELSE
    RETURN NEW;
  END IF;

  -- Insert activity log
  INSERT INTO public.activity_logs (
    event_type,
    entity_type,
    entity_id,
    user_id,
    metadata
  ) VALUES (
    event_type_value,
    'application',
    NEW.id,
    NULL, -- Applications don't have a user_id in auth
    jsonb_build_object(
      'job_id', NEW.job_id,
      'candidate_name', NEW.candidate_name,
      'email', NEW.email,
      'status', NEW.status,
      'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger for application events
CREATE TRIGGER trigger_log_application_events
AFTER INSERT OR UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.log_application_event();