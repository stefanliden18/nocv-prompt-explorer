import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminEditNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  currentFirstName: string | null;
  currentLastName: string | null;
  onSuccess: () => void;
}

export function AdminEditNameDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  currentFirstName,
  currentLastName,
  onSuccess,
}: AdminEditNameDialogProps) {
  const [firstName, setFirstName] = useState(currentFirstName ?? "");
  const [lastName, setLastName] = useState(currentLastName ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFirstName(currentFirstName ?? "");
      setLastName(currentLastName ?? "");
    }
  }, [open, currentFirstName, currentLastName]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("admin-update-profile", {
        body: { userId, firstName: firstName.trim(), lastName: lastName.trim() },
      });
      if (error) throw error;
      toast.success("Namn uppdaterat");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error("Kunde inte uppdatera namn");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ändra namn</DialogTitle>
          <DialogDescription>Ändra namn för {userEmail}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="admin-edit-first-name">Förnamn</Label>
            <Input
              id="admin-edit-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={saving}
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-edit-last-name">Efternamn</Label>
            <Input
              id="admin-edit-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={saving}
              maxLength={50}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Sparar..." : "Spara"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
