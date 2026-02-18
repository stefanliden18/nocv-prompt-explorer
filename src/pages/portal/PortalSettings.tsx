import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import PortalLayout from '@/components/portal/PortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function PortalSettings() {
  const { companyUserId, userName, calendarUrl, companyName } = usePortalAuth();
  const [name, setName] = useState(userName || '');
  const [calendar, setCalendar] = useState(calendarUrl || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!companyUserId) return;
    setSaving(true);
    const { error } = await supabase
      .from('company_users')
      .update({ name, calendar_url: calendar || null })
      .eq('id', companyUserId);

    if (error) {
      toast.error('Kunde inte spara');
    } else {
      toast.success('Inställningar sparade');
    }
    setSaving(false);
  };

  return (
    <PortalLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-6">Inställningar</h1>

        <div className="bg-card rounded-xl p-6 shadow-card space-y-5">
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Företag</Label>
            <p className="font-medium text-foreground mt-1">{companyName || '-'}</p>
          </div>

          <div>
            <Label htmlFor="name">Ditt namn</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="calendar">Kalenderlänk (Calendly / Cal.com)</Label>
            <Input id="calendar" value={calendar} onChange={e => setCalendar(e.target.value)} placeholder="https://calendly.com/..." />
            <p className="text-xs text-muted-foreground mt-1">Valfritt. Används för att dela din kalender med kandidater.</p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="bg-nocv-orange hover:bg-nocv-orange-hover text-white">
            {saving ? 'Sparar...' : 'Spara'}
          </Button>
        </div>
      </div>
    </PortalLayout>
  );
}
