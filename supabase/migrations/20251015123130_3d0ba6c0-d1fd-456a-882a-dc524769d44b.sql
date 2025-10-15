-- Fix data inconsistency for stefanliden18@gmail.com
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = 'deade7b7-ad7a-4316-9f0b-661183c95646';

-- Create function to sync profiles.role with user_roles
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete old roles for this user
  DELETE FROM public.user_roles WHERE user_id = NEW.id;
  
  -- Insert new role
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (NEW.id, NEW.role);
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync roles
CREATE TRIGGER sync_profile_role_trigger
AFTER UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_role();