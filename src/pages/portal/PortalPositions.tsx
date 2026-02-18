import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import PortalLayout from '@/components/portal/PortalLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Position {
  id: string;
  title: string;
  status: string;
  experience_level: string | null;
  candidate_count: number;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  active: { label: 'Aktiv', className: 'bg-emerald-100 text-emerald-800' },
  paused: { label: 'Pausad', className: 'bg-yellow-100 text-yellow-800' },
  filled: { label: 'Tillsatt', className: 'bg-muted text-muted-foreground' },
};

export default function PortalPositions() {
  const { companyId } = usePortalAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('positions')
        .select('id, title, status, experience_level')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (!data) { setLoading(false); return; }

      // Get candidate counts per position
      const positionIds = data.map(p => p.id);
      const { data: candidates } = await supabase
        .from('portal_candidates')
        .select('position_id')
        .in('position_id', positionIds);

      const countMap: Record<string, number> = {};
      candidates?.forEach(c => {
        countMap[c.position_id] = (countMap[c.position_id] || 0) + 1;
      });

      setPositions(data.map(p => ({ ...p, candidate_count: countMap[p.id] || 0 })));
      setLoading(false);
    };

    fetch();
  }, [companyId]);

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-6">Tjänster</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : positions.length === 0 ? (
          <div className="bg-card rounded-xl p-8 text-center shadow-card">
            <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Inga tjänster ännu.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map(pos => {
              const st = statusLabels[pos.status] || statusLabels.active;
              return (
                <Link
                  key={pos.id}
                  to={`/portal/positions/${pos.id}/candidates`}
                  className="flex items-center justify-between bg-card rounded-xl p-5 shadow-card hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground group-hover:text-nocv-orange transition-colors">
                        {pos.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', st.className)}>
                          {st.label}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {pos.candidate_count} kandidater
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-nocv-orange transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
