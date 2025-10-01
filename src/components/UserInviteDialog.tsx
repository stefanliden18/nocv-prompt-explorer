import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserInviteDialog({ open, onOpenChange, onSuccess }: UserInviteDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'recruiter' | 'admin'>('user');
  const [loading, setLoading] = useState(false);
  const [existingUser, setExistingUser] = useState<{ id: string; email: string; currentRole: string } | null>(null);
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);

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
      // Check if user already exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', email)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (existingProfile) {
        setExistingUser({
          id: existingProfile.id,
          email: existingProfile.email,
          currentRole: existingProfile.role,
        });
        setShowRoleChangeDialog(true);
        setLoading(false);
        return;
      }

      // Invite new user
      const redirectUrl = `${window.location.origin}/auth`;
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectUrl,
      });

      if (inviteError) throw inviteError;

      // Update profile role
      if (inviteData.user) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ role: role as any })
          .eq('id', inviteData.user.id);

        if (profileUpdateError) {
          console.error('Error updating profile role:', profileUpdateError);
        }

        // Set role in user_roles table
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: inviteData.user.id,
            role: role as any,
          } as any);

        if (roleError) {
          console.error('Error setting role:', roleError);
        }
      }

      // Send invitation email
      const inviteLink = `${window.location.origin}/auth`;
      await supabase.functions.invoke('send-user-invitation', {
        body: { email, role, inviteLink },
      });

      toast({
        title: 'Inbjudan skickad',
        description: `En inbjudan har skickats till ${email}`,
      });

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

  const handleRoleChange = async () => {
    if (!existingUser) return;

    setLoading(true);
    try {
      // Update profile role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: role as any })
        .eq('id', existingUser.id);

      if (profileError) throw profileError;

      // Update user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: existingUser.id,
          role: role as any,
        } as any, {
          onConflict: 'user_id,role',
        });

      if (roleError) throw roleError;

      toast({
        title: 'Roll uppdaterad',
        description: `Rollen för ${existingUser.email} har uppdaterats till ${role}`,
      });

      setShowRoleChangeDialog(false);
      setExistingUser(null);
      setEmail('');
      setRole('user');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Fel',
        description: error.message || 'Kunde inte uppdatera roll',
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

      <AlertDialog open={showRoleChangeDialog} onOpenChange={setShowRoleChangeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Användaren finns redan</AlertDialogTitle>
            <AlertDialogDescription>
              Användaren {existingUser?.email} finns redan i systemet med rollen{' '}
              <strong>{existingUser?.currentRole}</strong>. Vill du ändra rollen till{' '}
              <strong>{role}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRoleChangeDialog(false);
              setExistingUser(null);
            }}>
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Byt roll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
