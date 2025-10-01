import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface UserStatusToggleProps {
  userId: string;
  userEmail: string;
  currentStatus: boolean; // true = active, false = suspended
  isLastAdmin?: boolean;
  onSuccess: () => void;
}

export function UserStatusToggle({
  userId,
  userEmail,
  currentStatus,
  isLastAdmin = false,
  onSuccess,
}: UserStatusToggleProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleToggle = (checked: boolean) => {
    // If trying to suspend the last admin, block it
    if (!checked && isLastAdmin) {
      toast({
        title: 'Åtgärd blockerad',
        description: 'Kan inte stänga av den sista aktiva administratören',
        variant: 'destructive',
      });
      return;
    }

    setPendingStatus(checked);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    if (pendingStatus === null) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('toggle-user-status', {
        body: {
          userId,
          suspend: !pendingStatus, // suspend is opposite of active
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: pendingStatus ? 'Användare aktiverad' : 'Användare avstängd',
        description: `${userEmail} ${pendingStatus ? 'kan nu logga in' : 'kan inte längre logga in'}`,
      });

      onSuccess();
      setShowConfirmDialog(false);
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Fel',
        description: error.message || 'Kunde inte ändra användarstatus',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setPendingStatus(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Switch
          checked={currentStatus}
          onCheckedChange={handleToggle}
          disabled={loading}
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus ? 'Aktivera användare' : 'Stäng av användare'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus ? (
                <>
                  Vill du aktivera <strong>{userEmail}</strong>?
                  <br />
                  Användaren kommer kunna logga in igen.
                </>
              ) : (
                <>
                  Vill du stänga av <strong>{userEmail}</strong>?
                  <br />
                  Användaren kommer inte kunna logga in förrän kontot aktiveras igen.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Bekräfta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
