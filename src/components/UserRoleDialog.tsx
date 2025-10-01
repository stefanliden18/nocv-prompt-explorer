import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentRole: string;
  userEmail: string;
  isLastAdmin?: boolean;
  onSuccess: () => void;
}

export function UserRoleDialog({
  open,
  onOpenChange,
  userId,
  currentRole,
  userEmail,
  isLastAdmin = false,
  onSuccess,
}: UserRoleDialogProps) {
  const [newRole, setNewRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { toast } = useToast();

  const handleRoleSelect = (role: string) => {
    setNewRole(role);
    
    // Show warning if changing from admin and this is the last admin
    if (currentRole === 'admin' && role !== 'admin' && isLastAdmin) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };

  const handleConfirm = async () => {
    if (newRole === currentRole) {
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('change-user-role', {
        body: { userId, newRole },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Roll uppdaterad',
        description: `${userEmail} har nu rollen ${getRoleLabel(newRole)}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast({
        title: 'Fel',
        description: error.message || 'Kunde inte ändra användarens roll',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administratör';
      case 'recruiter':
        return 'Rekryterare';
      case 'user':
        return 'Användare';
      default:
        return role;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Byt användarroll</AlertDialogTitle>
          <AlertDialogDescription>
            Välj ny roll för {userEmail}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Select value={newRole} onValueChange={handleRoleSelect}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administratör</SelectItem>
              <SelectItem value="recruiter">Rekryterare</SelectItem>
              <SelectItem value="user">Användare</SelectItem>
            </SelectContent>
          </Select>

          {showWarning && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Varning: Detta är den sista aktiva administratören!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Om du ändrar denna roll kommer systemet inte ha någon aktiv administratör.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Avbryt</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading || (showWarning && currentRole === 'admin' && newRole !== 'admin')}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Bekräfta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
