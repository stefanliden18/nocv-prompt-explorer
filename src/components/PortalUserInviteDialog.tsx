import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PortalUserInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Company {
  id: string;
  name: string;
}

export function PortalUserInviteDialog({ open, onOpenChange, onSuccess }: PortalUserInviteDialogProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCompanies();
    }
  }, [open]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCompanyId || !email.trim() || !name.trim()) {
      toast({
        title: 'Fyll i alla fält',
        description: 'Välj företag och ange e-post och namn.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-portal-user', {
        body: { email: email.trim(), name: name.trim(), companyId: selectedCompanyId },
      });

      // supabase.functions.invoke throws on non-2xx, so check both error and data.error
      if (error) {
        // Try to parse the error body for a user-friendly message
        let message = 'Kunde inte skicka inbjudan.';
        try {
          const body = typeof error.context === 'object' && error.context?.body
            ? await new Response(error.context.body).text()
            : null;
          if (body) {
            const parsed = JSON.parse(body);
            message = parsed.error || message;
          }
        } catch {}
        toast({
          title: 'Kunde inte bjuda in',
          description: message,
          variant: 'destructive',
        });
        return;
      }

      if (data?.error) {
        toast({
          title: 'Kunde inte bjuda in',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Inbjudan skickad',
        description: `${name} har bjudits in till kundportalen.`,
      });

      // Reset form
      setSelectedCompanyId('');
      setEmail('');
      setName('');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error inviting portal user:', error);
      toast({
        title: 'Något gick fel',
        description: error.message || 'Kunde inte skicka inbjudan.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bjud in portalanvändare</DialogTitle>
          <DialogDescription>
            Bjud in en kund till kundportalen. De får ett mail med inloggningslänk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="company">Företag</Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingCompanies ? 'Laddar...' : 'Välj företag'} />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Namn</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Förnamn Efternamn"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kund@foretag.se"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Skicka inbjudan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
