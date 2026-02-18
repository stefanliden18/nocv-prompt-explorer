
-- =============================================
-- TABLE: company_users (must be created BEFORE helper function)
-- =============================================
CREATE TABLE public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'admin',
  calendar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company_user" ON public.company_users
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all company_users" ON public.company_users
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert company_users" ON public.company_users
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update company_users" ON public.company_users
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete company_users" ON public.company_users
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own company_user" ON public.company_users
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- HELPER FUNCTION: get_user_company_id (now table exists)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.company_users
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- =============================================
-- TABLE: positions
-- =============================================
CREATE TABLE public.positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  experience_level text DEFAULT 'mid',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view positions" ON public.positions
  FOR SELECT TO authenticated USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Admins can view all positions" ON public.positions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert positions" ON public.positions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update positions" ON public.positions
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete positions" ON public.positions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TABLE: portal_candidates
-- =============================================
CREATE TABLE public.portal_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  name text NOT NULL,
  summary text,
  strengths text[] DEFAULT '{}',
  experience_years integer,
  skill_level text DEFAULT 'mid',
  video_url text,
  audio_url text,
  status text NOT NULL DEFAULT 'new',
  presented_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view candidates" ON public.portal_candidates
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.positions p WHERE p.id = portal_candidates.position_id AND p.company_id = public.get_user_company_id(auth.uid())));

CREATE POLICY "Company users can update candidate status" ON public.portal_candidates
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.positions p WHERE p.id = portal_candidates.position_id AND p.company_id = public.get_user_company_id(auth.uid())));

CREATE POLICY "Admins can view all candidates" ON public.portal_candidates
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert candidates" ON public.portal_candidates
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update candidates" ON public.portal_candidates
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete candidates" ON public.portal_candidates
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TABLE: portal_interviews
-- =============================================
CREATE TABLE public.portal_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.portal_candidates(id) ON DELETE CASCADE,
  company_user_id uuid NOT NULL REFERENCES public.company_users(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  location_type text NOT NULL DEFAULT 'onsite',
  location_details text,
  notes text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view interviews" ON public.portal_interviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.company_users cu WHERE cu.id = portal_interviews.company_user_id AND cu.company_id = public.get_user_company_id(auth.uid()))
    OR EXISTS (SELECT 1 FROM public.portal_candidates pc JOIN public.positions p ON p.id = pc.position_id WHERE pc.id = portal_interviews.candidate_id AND p.company_id = public.get_user_company_id(auth.uid()))
  );

CREATE POLICY "Company users can insert interviews" ON public.portal_interviews
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_users cu WHERE cu.id = portal_interviews.company_user_id AND cu.user_id = auth.uid()));

CREATE POLICY "Company users can update interviews" ON public.portal_interviews
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.company_users cu WHERE cu.id = portal_interviews.company_user_id AND cu.user_id = auth.uid()));

CREATE POLICY "Admins can view all interviews" ON public.portal_interviews
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert interviews" ON public.portal_interviews
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update interviews" ON public.portal_interviews
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete interviews" ON public.portal_interviews
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TABLE: portal_notifications
-- =============================================
CREATE TABLE public.portal_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_user_id uuid NOT NULL REFERENCES public.company_users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'new_candidate',
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  related_candidate_id uuid REFERENCES public.portal_candidates(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.portal_notifications
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.company_users cu WHERE cu.id = portal_notifications.company_user_id AND cu.user_id = auth.uid()));

CREATE POLICY "Users can update own notifications" ON public.portal_notifications
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.company_users cu WHERE cu.id = portal_notifications.company_user_id AND cu.user_id = auth.uid()));

CREATE POLICY "Admins can view all notifications" ON public.portal_notifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert notifications" ON public.portal_notifications
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notifications" ON public.portal_notifications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notifications" ON public.portal_notifications
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGER: Auto-create notification on new candidate
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_new_portal_candidate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.portal_notifications (company_user_id, type, title, message, related_candidate_id)
  SELECT cu.id, 'new_candidate', 'Ny kandidat presenterad',
    'En ny kandidat (' || NEW.name || ') har presenterats för tjänsten.', NEW.id
  FROM public.company_users cu
  JOIN public.positions p ON p.company_id = cu.company_id
  WHERE p.id = NEW.position_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_portal_candidate
  AFTER INSERT ON public.portal_candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_portal_candidate();
