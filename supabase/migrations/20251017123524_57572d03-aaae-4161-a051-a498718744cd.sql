-- Fix search_path for all remaining SECURITY DEFINER functions

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Assign default 'user' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- Fix is_recruiter_or_admin function
CREATE OR REPLACE FUNCTION public.is_recruiter_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role IN ('recruiter', 'admin')
  )
$function$;

-- Fix is_job_creator function
CREATE OR REPLACE FUNCTION public.is_job_creator(_user_id uuid, _job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE id = _job_id
      AND created_by = _user_id
  )
$function$;

-- Fix can_access_application function
CREATE OR REPLACE FUNCTION public.can_access_application(_user_id uuid, _application_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.jobs j ON a.job_id = j.id
    WHERE a.id = _application_id
      AND (j.created_by = _user_id OR public.has_role(_user_id, 'admin'))
  )
$function$;

-- Fix sync_profile_role function
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Delete old roles for this user
  DELETE FROM public.user_roles WHERE user_id = NEW.id;
  
  -- Insert new role
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (NEW.id, NEW.role);
  
  RETURN NEW;
END;
$function$;

-- Fix applications_before_insert function
CREATE OR REPLACE FUNCTION public.applications_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM public.enforce_application_limits(NEW.email);
  RETURN NEW;
END $function$;

-- Fix enforce_application_limits function
CREATE OR REPLACE FUNCTION public.enforce_application_limits(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF p_email IS NULL THEN RETURN; END IF;
  
  -- Check 10-minute limit
  IF EXISTS (
    SELECT 1 FROM public.applications
    WHERE email = p_email 
    AND created_at > now() - interval '10 minutes'
  ) THEN
    RAISE EXCEPTION 'För många försök, vänta minst 10 minuter mellan ansökningar';
  END IF;
  
  -- Check daily limit (24 hours)
  IF (SELECT count(*) FROM public.applications
      WHERE email = p_email 
      AND created_at > now() - interval '1 day') >= 10 THEN
    RAISE EXCEPTION 'Daglig gräns uppnådd (max 10 ansökningar per dag)';
  END IF;
END $function$;

-- Fix log_user_role_change function
CREATE OR REPLACE FUNCTION public.log_user_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix count_active_admins function
CREATE OR REPLACE FUNCTION public.count_active_admins()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles p
  WHERE p.role = 'admin'
    AND NOT EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = p.id 
      AND au.banned_until IS NOT NULL 
      AND au.banned_until > now()
    );
$function$;