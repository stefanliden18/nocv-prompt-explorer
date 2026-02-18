import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/portal/PortalLayout';
import PortalCandidateCard from '@/components/portal/PortalCandidateCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const filters = [
  { key: 'all', label: 'Alla' },
  { key: 'new', label: 'Nya' },
  { key: 'reviewed', label: 'Granskade' },
  { key: 'interview_booked', label: 'Bokade' },
];

export default function PortalCandidateList() {
  const { id: positionId } = useParams<{ id: string }>();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [positionTitle, setPositionTitle] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!positionId) return;

    const fetch = async () => {
      const [{ data: pos }, { data: cands }] = await Promise.all([
        supabase.from('positions').select('title').eq('id', positionId).single(),
        supabase.from('portal_candidates').select('*').eq('position_id', positionId).order('presented_at', { ascending: false }),
      ]);
      setPositionTitle(pos?.title || '');
      setCandidates(cands || []);
      setLoading(false);
    };

    fetch();
  }, [positionId]);

  const filtered = activeFilter === 'all'
    ? candidates
    : candidates.filter(c => c.status === activeFilter);

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <Link to="/portal/positions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Tillbaka till tjänster
        </Link>

        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">{positionTitle}</h1>
        <p className="text-muted-foreground mb-6">{candidates.length} kandidater</p>

        {/* Filter chips */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeFilter === f.key
                  ? 'bg-nocv-orange text-white'
                  : 'bg-card text-muted-foreground hover:bg-muted shadow-sm'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-xl p-8 text-center shadow-card">
            <p className="text-muted-foreground">Inga kandidater att visa.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(c => (
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
    </PortalLayout>
  );
}
