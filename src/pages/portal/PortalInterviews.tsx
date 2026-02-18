import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, User, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import PortalLayout from '@/components/portal/PortalLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const locationLabels: Record<string, string> = {
  onsite: 'På plats',
  teams: 'Teams / Video',
  phone: 'Telefon',
};

export default function PortalInterviews() {
  const { companyId } = usePortalAuth();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterviews = async () => {
    const { data } = await supabase
      .from('portal_interviews')
      .select('*, portal_candidates(name, id), company_users(name)')
      .order('scheduled_at', { ascending: true });

    setInterviews(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchInterviews(); }, [companyId]);

  const cancelInterview = async (interviewId: string, candidateId: string) => {
    const { error } = await supabase.from('portal_interviews').update({ status: 'cancelled' }).eq('id', interviewId);
    if (error) { toast.error('Kunde inte avboka'); return; }
    // Reset candidate status
    await supabase.from('portal_candidates').update({ status: 'reviewed' }).eq('id', candidateId);
    toast.success('Intervju avbokad');
    fetchInterviews();
  };

  const scheduled = interviews.filter(i => i.status === 'scheduled');
  const past = interviews.filter(i => i.status !== 'scheduled');

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-6">Intervjuer</h1>

        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : scheduled.length === 0 && past.length === 0 ? (
          <div className="bg-card rounded-xl p-8 text-center shadow-card">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Inga intervjuer bokade ännu.</p>
          </div>
        ) : (
          <>
            {scheduled.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Kommande</h2>
                <div className="space-y-3">
                  {scheduled.map(i => {
                    const cand = i.portal_candidates as any;
                    return (
                      <div key={i.id} className="bg-card rounded-xl p-5 shadow-card">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div>
                            <Link to={`/portal/candidates/${cand?.id}`} className="font-heading font-semibold text-foreground hover:text-nocv-orange transition-colors">
                              {cand?.name}
                            </Link>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(i.scheduled_at), "d MMM yyyy 'kl' HH:mm", { locale: sv })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {i.duration_minutes} min
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> {locationLabels[i.location_type] || i.location_type}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => cancelInterview(i.id, cand?.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Avboka
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="text-lg font-heading font-semibold text-muted-foreground mb-4">Historik</h2>
                <div className="space-y-3">
                  {past.map(i => {
                    const cand = i.portal_candidates as any;
                    return (
                      <div key={i.id} className="bg-card rounded-xl p-5 shadow-card opacity-60">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{cand?.name}</span>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            i.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          )}>
                            {i.status === 'completed' ? 'Genomförd' : 'Avbokad'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PortalLayout>
  );
}
