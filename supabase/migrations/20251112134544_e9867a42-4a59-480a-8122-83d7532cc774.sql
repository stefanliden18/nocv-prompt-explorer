-- Create trigger to automatically mark applications to demo jobs as demo
-- Note: The function mark_demo_application() already exists and does exactly what we need
CREATE TRIGGER before_application_insert_mark_demo
  BEFORE INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION mark_demo_application();

-- Update existing applications that are linked to demo jobs but not marked as demo
UPDATE applications a
SET is_demo = true
FROM jobs j
WHERE a.job_id = j.id
  AND j.status = 'demo'
  AND a.is_demo = false;