import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PortalAuthData {
  companyUserId: string | null;
  companyId: string | null;
  companyName: string | null;
  userName: string | null;
  userRole: string | null;
  calendarUrl: string | null;
  loading: boolean;
  isPortalUser: boolean;
}

export function usePortalAuth(): PortalAuthData {
  const { user } = useAuth();
  const [data, setData] = useState<PortalAuthData>({
    companyUserId: null,
    companyId: null,
    companyName: null,
    userName: null,
    userRole: null,
    calendarUrl: null,
    loading: true,
    isPortalUser: false,
  });

  useEffect(() => {
    if (!user) {
      setData(prev => ({ ...prev, loading: false, isPortalUser: false }));
      return;
    }

    const fetchPortalAuth = async () => {
      try {
        const { data: companyUser, error } = await supabase
          .from('company_users')
          .select('id, company_id, name, role, calendar_url, companies(name)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error || !companyUser) {
          setData(prev => ({ ...prev, loading: false, isPortalUser: false }));
          return;
        }

        const companyData = companyUser.companies as any;

        setData({
          companyUserId: companyUser.id,
          companyId: companyUser.company_id,
          companyName: companyData?.name || null,
          userName: companyUser.name,
          userRole: companyUser.role,
          calendarUrl: companyUser.calendar_url,
          loading: false,
          isPortalUser: true,
        });
      } catch {
        setData(prev => ({ ...prev, loading: false, isPortalUser: false }));
      }
    };

    fetchPortalAuth();
  }, [user]);

  return data;
}
