import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Send, CalendarPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import PortalLayout from '@/components/portal/PortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type BookingMode = 'direct' | 'proposal';

export default function PortalBooking() {
  const { id: candidateId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companyUserId } = usePortalAuth();
  const [candidateName, setCandidateName] = useState('');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<BookingMode>('proposal');

  const [form, setForm] = useState({
    date: '',
    time: '',
    date2: '',
    time2: '',
    duration: '30',
    locationType: 'onsite',
    locationDetails: '',
    notes: '',
  });

  useEffect(() => {
    if (!candidateId) return;
    supabase.from('portal_candidates').select('name').eq('id', candidateId).single()
      .then(({ data }) => setCandidateName(data?.name || ''));
  }, [candidateId]);

  const [emailStatus, setEmailStatus] = useState<'sent' | 'no_email' | 'failed' | null>(null);

  // Direct booking (existing flow)
  const handleDirectSubmit = async () => {
    if (!companyUserId || !candidateId) return;
    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
      const { data: insertedInterview, error } = await supabase.from('portal_interviews').insert({
        candidate_id: candidateId,
        company_user_id: companyUserId,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(form.duration),
        location_type: form.locationType,
        location_details: form.locationDetails || null,
        notes: form.notes || null,
      }).select('id').single();

      if (error) throw error;

      await supabase.from('portal_candidates').update({ status: 'interview_booked' }).eq('id', candidateId);

      if (insertedInterview?.id) {
        try {
          const { data: emailResult, error: emailErr } = await supabase.functions.invoke(
            'send-portal-interview-invitation',
            { body: { portalInterviewId: insertedInterview.id } }
          );
          if (emailErr) { setEmailStatus('failed'); }
          else if (emailResult?.success === false && emailResult?.reason === 'no_email') { setEmailStatus('no_email'); }
          else if (emailResult?.success) { setEmailStatus('sent'); }
          else { setEmailStatus('failed'); }
        } catch { setEmailStatus('failed'); }
      }

      setStep(3);
      toast.success('Intervju bokad!');
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte boka intervju');
    } finally {
      setSubmitting(false);
    }
  };

  // Proposal flow (new)
  const handleProposalSubmit = async () => {
    if (!companyUserId || !candidateId) return;
    setSubmitting(true);
    try {
      const option1 = new Date(`${form.date}T${form.time}`).toISOString();
      const option2 = new Date(`${form.date2}T${form.time2}`).toISOString();

      const { data: proposal, error } = await supabase.from('portal_interview_proposals' as any).insert({
        candidate_id: candidateId,
        company_user_id: companyUserId,
        option_1_at: option1,
        option_2_at: option2,
        duration_minutes: parseInt(form.duration),
        location_type: form.locationType,
        location_details: form.locationDetails || null,
        notes: form.notes || null,
      } as any).select('id, respond_token').single();

      if (error) throw error;

      await supabase.from('portal_candidates').update({ status: 'proposal_sent' }).eq('id', candidateId);

      // Send proposal email
      if ((proposal as any)?.id) {
        try {
          const { data: emailResult, error: emailErr } = await supabase.functions.invoke(
            'send-interview-proposal',
            { body: { proposalId: (proposal as any).id } }
          );
          if (emailErr) { setEmailStatus('failed'); }
          else if (emailResult?.success === false && emailResult?.reason === 'no_email') { setEmailStatus('no_email'); }
          else if (emailResult?.success) { setEmailStatus('sent'); }
          else { setEmailStatus('failed'); }
        } catch { setEmailStatus('failed'); }
      }

      setStep(3);
      toast.success('Tidsförslag skickat!');
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte skicka förslag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = mode === 'direct' ? handleDirectSubmit : handleProposalSubmit;

  const canProceedStep1 = mode === 'direct'
    ? !!(form.date && form.time)
    : !!(form.date && form.time && form.date2 && form.time2);

  const steps = [
    { num: 1, label: 'Välj tid' },
    { num: 2, label: 'Bekräfta' },
    { num: 3, label: 'Klart' },
  ];

  return (
    <PortalLayout>
      <div className="max-w-xl mx-auto">
        <Link to={`/portal/candidates/${candidateId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Tillbaka till profil
        </Link>

        <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Boka intervju</h1>
        <p className="text-muted-foreground mb-6">med {candidateName}</p>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold',
                step >= s.num ? 'bg-nocv-orange text-white' : 'bg-muted text-muted-foreground'
              )}>
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className={cn('text-sm hidden sm:inline', step >= s.num ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Choose time */}
        {step === 1 && (
          <div className="bg-card rounded-xl p-6 shadow-card space-y-5">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <Button
                variant={mode === 'proposal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('proposal')}
                className={cn(mode === 'proposal' && 'bg-nocv-orange hover:bg-nocv-orange-hover text-white')}
              >
                <Send className="h-4 w-4 mr-1" /> Skicka tidsförslag
              </Button>
              <Button
                variant={mode === 'direct' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('direct')}
                className={cn(mode === 'direct' && 'bg-nocv-orange hover:bg-nocv-orange-hover text-white')}
              >
                <CalendarPlus className="h-4 w-4 mr-1" /> Direktboka
              </Button>
            </div>

            {mode === 'proposal' && (
              <p className="text-sm text-muted-foreground">
                Kandidaten får ett mejl med 2 alternativa tider och väljer den som passar bäst.
              </p>
            )}

            {/* Option 1 */}
            <div>
              <Label className="text-sm font-semibold">{mode === 'proposal' ? 'Alternativ 1' : 'Datum & tid'}</Label>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <div>
                  <Label className="text-xs text-muted-foreground">Datum</Label>
                  <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tid</Label>
                  <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Option 2 (proposal only) */}
            {mode === 'proposal' && (
              <div>
                <Label className="text-sm font-semibold">Alternativ 2</Label>
                <div className="grid grid-cols-2 gap-4 mt-1">
                  <div>
                    <Label className="text-xs text-muted-foreground">Datum</Label>
                    <Input type="date" value={form.date2} onChange={e => setForm({ ...form, date2: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tid</Label>
                    <Input type="time" value={form.time2} onChange={e => setForm({ ...form, time2: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label>Längd</Label>
              <Select value={form.duration} onValueChange={v => setForm({ ...form, duration: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plats</Label>
              <Select value={form.locationType} onValueChange={v => setForm({ ...form, locationType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="onsite">På plats</SelectItem>
                  <SelectItem value="teams">Teams / Videomöte</SelectItem>
                  <SelectItem value="phone">Telefon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Adress / Möteslänk</Label>
              <Input value={form.locationDetails} onChange={e => setForm({ ...form, locationDetails: e.target.value })} placeholder="T.ex. Storgatan 1 eller Teams-länk" />
            </div>
            <div>
              <Label>Anteckningar (valfritt)</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Ev. information till kandidaten..." rows={3} />
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full bg-nocv-orange hover:bg-nocv-orange-hover text-white"
            >
              Fortsätt
            </Button>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
            <h2 className="font-heading font-semibold text-foreground">
              {mode === 'proposal' ? 'Bekräfta tidsförslag' : 'Bekräfta bokning'}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Kandidat</span><span className="font-medium">{candidateName}</span></div>

              {mode === 'proposal' ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Alternativ 1</span><span className="font-medium">{form.date} kl {form.time}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Alternativ 2</span><span className="font-medium">{form.date2} kl {form.time2}</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Datum</span><span className="font-medium">{form.date}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tid</span><span className="font-medium">{form.time}</span></div>
                </>
              )}

              <div className="flex justify-between"><span className="text-muted-foreground">Längd</span><span className="font-medium">{form.duration} min</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plats</span><span className="font-medium">{form.locationType === 'onsite' ? 'På plats' : form.locationType === 'teams' ? 'Teams' : 'Telefon'}</span></div>
              {form.locationDetails && <div className="flex justify-between"><span className="text-muted-foreground">Detaljer</span><span className="font-medium">{form.locationDetails}</span></div>}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Tillbaka</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-nocv-orange hover:bg-nocv-orange-hover text-white">
                {submitting ? (mode === 'proposal' ? 'Skickar...' : 'Bokar...') : (mode === 'proposal' ? 'Skicka förslag' : 'Bekräfta')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="bg-card rounded-xl p-8 shadow-card text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">
              {mode === 'proposal' ? 'Tidsförslag skickat!' : 'Intervju bokad!'}
            </h2>

            {emailStatus === 'sent' && (
              <p className="text-emerald-600 font-medium mb-2">
                {mode === 'proposal'
                  ? '✉️ Kandidaten har fått ett mejl med de två tidsalternativen.'
                  : '✉️ Bekräftelsemail med kalenderinbjudan har skickats till kandidaten.'}
              </p>
            )}
            {emailStatus === 'no_email' && (
              <p className="text-amber-600 font-medium mb-2">⚠️ Kandidaten saknar e-postadress — inget mail skickades.</p>
            )}
            {emailStatus === 'failed' && (
              <p className="text-red-600 font-medium mb-2">❌ Mailet kunde inte skickas.</p>
            )}

            <p className="text-muted-foreground mb-6">
              {mode === 'proposal'
                ? 'Du ser status under "Intervjuer" i menyn. När kandidaten valt en tid bokas intervjun automatiskt.'
                : 'Du hittar intervjun under "Intervjuer" i menyn.'}
            </p>
            <Button asChild className="bg-nocv-orange hover:bg-nocv-orange-hover text-white">
              <Link to="/portal/interviews">Visa intervjuer</Link>
            </Button>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
