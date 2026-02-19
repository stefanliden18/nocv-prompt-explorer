import { useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";

export function ProfileNameDialog() {
  const { user, firstName, loading, updateProfileName } = useAuth();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [saving, setSaving] = useState(false);

  // Show dialog only when user is logged in and has no first_name set
  const open = !loading && !!user && firstName === null;

  const handleSave = async () => {
    if (!first.trim() || !last.trim()) return;
    setSaving(true);
    try {
      await updateProfileName(first.trim(), last.trim());
    } catch {
      // error handled in context
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Välkommen! Ange ditt namn</DialogTitle>
          <DialogDescription>
            Vi behöver ditt för- och efternamn för att kunna personifiera kommunikationen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="profile-first-name">Förnamn *</Label>
            <Input
              id="profile-first-name"
              placeholder="Stefan"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              disabled={saving}
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-last-name">Efternamn *</Label>
            <Input
              id="profile-last-name"
              placeholder="Andersson"
              value={last}
              onChange={(e) => setLast(e.target.value)}
              disabled={saving}
              maxLength={50}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving || !first.trim() || !last.trim()}>
            {saving ? "Sparar..." : "Spara"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
