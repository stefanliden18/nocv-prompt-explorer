import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function InterviewRespond() {
  const { token } = useParams<{ token: string }>();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    supabase
      .from('portal_interview_proposals' as any)
      .select('*, portal_candidates(name), company_users(name, companies(name))')
      .eq('respond_token', token)
      .single()
      .then(({ data, error: err }: any) => {
        if (err || !data) {
          setError('Länken är ogiltig eller har redan använts.');
        } else if (data.status !== 'pending') {
          setProposal(data);
          setConfirmed(true);
        } else {
          setProposal(data);
        }
        setLoading(false);
      });
  }, [token]);

  const handleChoose = async (option: 1 | 2 | 3) => {
    if (!proposal || !token) return;
    setConfirming(true);
    try {
      const { data, error: err } = await supabase.functions.invoke('confirm-interview-proposal', {
        body: { token, chosenOption: option },
      });

      if (err) throw new Error('Något gick fel');
      if (data?.error) throw new Error(data.error);

      setConfirmed(true);
      setProposal({ ...proposal, status: 'accepted', chosen_option: option });
    } catch (e: any) {
      setError(e.message || 'Kunde inte bekräfta');
    } finally {
      setConfirming(false);
    }
  };

  const formatOption = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: formatInTimeZone(d, 'Europe/Stockholm', "EEEE d MMMM yyyy", { locale: sv }),
      time: formatInTimeZone(d, 'Europe/Stockholm', "HH:mm", { locale: sv }),
    };
  };

  const locationLabel =
    proposal?.location_type === 'onsite' ? 'På plats' :
    proposal?.location_type === 'teams' ? 'Teams / Videomöte' : 'Telefon';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="bg-card rounded-xl p-8 shadow-card max-w-md text-center">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const candidateName = proposal?.portal_candidates?.name || 'Kandidat';
  const companyName = proposal?.company_users?.companies?.name || proposal?.company_users?.name || '';
  const bookerName = proposal?.company_users?.name || '';

  if (confirmed) {
    const chosenDate = proposal.chosen_option === 1 ? proposal.option_1_at : proposal.chosen_option === 2 ? proposal.option_2_at : proposal.option_3_at;
    const chosen = formatOption(chosenDate);

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="bg-card rounded-xl p-8 shadow-card max-w-md text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Intervju bekräftad!</h1>
          <p className="text-muted-foreground mb-4">
            Din intervju är bokad {chosen.date} kl {chosen.time}.
          </p>
          <p className="text-sm text-muted-foreground">
            Du kommer att få en kalenderinbjudan via e-post.
          </p>
        </div>
      </div>
    );
  }

  const opt1 = formatOption(proposal.option_1_at);
  const opt2 = formatOption(proposal.option_2_at);
  const opt3 = proposal.option_3_at ? formatOption(proposal.option_3_at) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="bg-card rounded-xl shadow-card max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-nocv-orange to-nocv-orange-hover p-6 text-center">
          <h1 className="text-xl font-bold text-white">Välj intervjutid</h1>
          {companyName && <p className="text-white/80 text-sm mt-1">{companyName}</p>}
        </div>

        <div className="p-6 space-y-5">
          <p className="text-foreground">
            Hej {candidateName}! {bookerName ? `${bookerName} ` : ''}vill bjuda in dig till en intervju. Välj den tid som passar dig bäst:
          </p>

          {/* Shared details */}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {proposal.duration_minutes} min</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {locationLabel}</span>
            {proposal.location_details && <span className="text-xs">({proposal.location_details})</span>}
          </div>

          {/* Option buttons */}
          <div className="space-y-3">
            {[
              { num: 1 as const, ...opt1 },
              { num: 2 as const, ...opt2 },
              ...(opt3 ? [{ num: 3 as const, ...opt3 }] : []),
            ].map((opt) => (
              <button
                key={opt.num}
                onClick={() => handleChoose(opt.num)}
                disabled={confirming}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                  'hover:border-nocv-orange hover:bg-nocv-orange/5',
                  'border-border bg-card',
                  confirming && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-nocv-orange flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground capitalize">{opt.date}</p>
                    <p className="text-sm text-muted-foreground">kl {opt.time}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {confirming && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Bekräftar...</span>
            </div>
          )}

          {error && <p className="text-destructive text-sm text-center">{error}</p>}

          {proposal.notes && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Meddelande:</p>
              <p className="text-sm text-foreground">{proposal.notes}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-muted-foreground">Via NoCV</p>
        </div>
      </div>
    </div>
  );
}
