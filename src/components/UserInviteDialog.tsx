import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface UserInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserInviteDialog({ open, onOpenChange, onSuccess }: UserInviteDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'recruiter' | 'admin'>('user');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: 'Ogiltig e-post',
        description: 'Vänligen ange en giltig e-postadress.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Call edge function - it handles both new and existing users
      const { data, error: inviteError } = await supabase.functions.invoke('invite-user', {
        body: { email, role },
      });

      if (inviteError) throw inviteError;

      if (data?.updated) {
        toast({
          title: 'Roll uppdaterad',
          description: `Roll uppdaterad för ${email} till ${role}`,
        });
      } else {
        toast({
          title: 'Inbjudan skickad',
          description: `En inbjudan har skickats till ${email}`,
        });
      }

      setEmail('');
      setRole('user');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast({
        title: 'Fel',
        description: error.message || 'Kunde inte skicka inbjudan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bjud in ny användare</DialogTitle>
            <DialogDescription>
              Ange e-postadress och välj roll för den nya användaren.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-postadress</Label>
              <Input
                id="email"
                type="email"
                placeholder="anvandare@exempel.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Roll</Label>
              <Select value={role} onValueChange={(value) => setRole(value as any)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Användare</SelectItem>
                  <SelectItem value="recruiter">Rekryterare</SelectItem>
                  <SelectItem value="admin">Administratör</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Skicka inbjudan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
