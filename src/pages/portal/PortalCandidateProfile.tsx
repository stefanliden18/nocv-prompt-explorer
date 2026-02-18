import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Star, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/portal/PortalLayout';
import PortalStatusBadge from '@/components/portal/PortalStatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const skillLabels: Record<string, string> = {
  junior: 'Junior', mid: 'Mellannivå', senior: 'Senior',
};

export default function PortalCandidateProfile() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<any>(null);
  const [positionTitle, setPositionTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('portal_candidates')
        .select('*, positions(title, id)')
        .eq('id', id)
        .single();

      if (data) {
        setCandidate(data);
        setPositionTitle((data.positions as any)?.title || '');
        // Mark as reviewed if new
        if (data.status === 'new') {
          await supabase.from('portal_candidates').update({ status: 'reviewed' }).eq('id', id);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <PortalLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </PortalLayout>
    );
  }

  if (!candidate) {
    return (
      <PortalLayout>
        <div className="max-w-3xl mx-auto text-center py-16">
          <p className="text-muted-foreground">Kandidaten hittades inte.</p>
        </div>
      </PortalLayout>
    );
  }

  const posId = (candidate.positions as any)?.id;

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        <Link
          to={posId ? `/portal/positions/${posId}/candidates` : '/portal/positions'}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Tillbaka
        </Link>

        {/* Header */}
        <div className="bg-card rounded-xl p-6 shadow-card mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">{candidate.name}</h1>
                <p className="text-muted-foreground">{positionTitle}</p>
              </div>
            </div>
            <PortalStatusBadge status={candidate.status} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Nivå</p>
              <p className="font-medium text-foreground mt-1">{skillLabels[candidate.skill_level] || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Erfarenhet</p>
              <p className="font-medium text-foreground mt-1">
                {candidate.experience_years != null ? `${candidate.experience_years} år` : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Presenterad</p>
              <p className="font-medium text-foreground mt-1">
                {candidate.presented_at ? format(new Date(candidate.presented_at), 'd MMM yyyy', { locale: sv }) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {candidate.summary && (
          <div className="bg-card rounded-xl p-6 shadow-card mb-6">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">AI-sammanfattning</h2>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{candidate.summary}</p>
          </div>
        )}

        {/* Strengths */}
        {candidate.strengths && candidate.strengths.length > 0 && (
          <div className="bg-card rounded-xl p-6 shadow-card mb-6">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">Styrkor</h2>
            <ul className="space-y-2">
              {candidate.strengths.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-nocv-orange shrink-0 mt-0.5" />
                  <span className="text-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-3">
          <Button asChild className="bg-nocv-orange hover:bg-nocv-orange-hover text-white shadow-cta">
            <Link to={`/portal/candidates/${candidate.id}/book`}>
              <Calendar className="h-4 w-4 mr-2" />
              Boka intervju
            </Link>
          </Button>
        </div>
      </div>
    </PortalLayout>
  );
}
