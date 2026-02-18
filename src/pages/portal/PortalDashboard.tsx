import { useEffect, useState } from 'react';
import { Users, Briefcase, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import PortalLayout from '@/components/portal/PortalLayout';
import PortalStatCard from '@/components/portal/PortalStatCard';
import PortalCandidateCard from '@/components/portal/PortalCandidateCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function PortalDashboard() {
  const { companyName, companyId } = usePortalAuth();
  const [stats, setStats] = useState({ candidates: 0, positions: 0, interviews: 0 });
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      try {
        // Fetch positions for this company
        const { data: positions } = await supabase
          .from('positions')
          .select('id')
          .eq('company_id', companyId)
          .eq('status', 'active');

        const positionIds = positions?.map(p => p.id) || [];

        // Fetch candidates count
        let candidateCount = 0;
        let candidates: any[] = [];
        if (positionIds.length > 0) {
          const { data: cands, count } = await supabase
            .from('portal_candidates')
            .select('*', { count: 'exact' })
            .in('position_id', positionIds)
            .order('presented_at', { ascending: false })
            .limit(5);
          candidateCount = count || 0;
          candidates = cands || [];
        }

        // Fetch interviews count
        const { count: interviewCount } = await supabase
          .from('portal_interviews')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'scheduled');

        setStats({
          candidates: candidateCount,
          positions: positions?.length || 0,
          interviews: interviewCount || 0,
        });
        setRecentCandidates(candidates);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  return (
    <PortalLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            Välkommen{companyName ? `, ${companyName}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">Översikt av era rekryteringar</p>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <PortalStatCard title="Nya kandidater" value={stats.candidates} icon={Users} color="orange" />
            <PortalStatCard title="Aktiva tjänster" value={stats.positions} icon={Briefcase} color="blue" />
            <PortalStatCard title="Kommande intervjuer" value={stats.interviews} icon={Calendar} color="green" />
          </div>
        )}

        {/* Recent candidates */}
        <div>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Senaste kandidater</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : recentCandidates.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center shadow-card">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Inga kandidater presenterade ännu.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {recentCandidates.map(c => (
                <PortalCandidateCard
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  skillLevel={c.skill_level}
                  experienceYears={c.experience_years}
                  status={c.status}
                  presentedAt={c.presented_at}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
