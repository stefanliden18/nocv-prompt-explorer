-- Fix the sync_profile_role trigger to cast between enum types
CREATE OR REPLACE FUNCTION public.sync_profile_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete old roles for this user
  DELETE FROM public.user_roles WHERE user_id = NEW.id;
  
  -- Insert new role, casting profile_role to app_role via text
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (NEW.id, NEW.role::text::app_role);
  
  RETURN NEW;
END;
$function$;