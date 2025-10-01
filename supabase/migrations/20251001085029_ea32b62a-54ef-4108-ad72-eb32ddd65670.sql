-- Add banned_until column to auth.users for user suspension
-- Note: We'll use Supabase Auth Admin API to handle this, no schema changes needed

-- Create function to count active admins
CREATE OR REPLACE FUNCTION public.count_active_admins()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles p
  WHERE p.role = 'admin'
    AND NOT EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = p.id 
      AND au.banned_until IS NOT NULL 
      AND au.banned_until > now()
    );
$$;

-- Create trigger function for role changes
CREATE OR REPLACE FUNCTION public.log_user_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log role change in activity_logs
  INSERT INTO public.activity_logs (
    event_type,
    entity_type,
    entity_id,
    user_id,
    metadata
  ) VALUES (
    'user_role_changed',
    'user',
    NEW.id,
    auth.uid(),
    jsonb_build_object(
      'old_role', OLD.role,
      'new_role', NEW.role,
      'email', NEW.email
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for role changes
DROP TRIGGER IF EXISTS on_user_role_changed ON public.profiles;
CREATE TRIGGER on_user_role_changed
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.log_user_role_change();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.count_active_admins() TO authenticated;