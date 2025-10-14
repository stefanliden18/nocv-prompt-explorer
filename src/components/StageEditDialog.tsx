import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StageEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: {
    id: string;
    name: string;
    color: string;
  } | null;
  onSave: (id: string, name: string, color: string) => Promise<void>;
}

const colorPresets = [
  { name: 'Blå', value: '#3b82f6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Grön', value: '#10b981' },
  { name: 'Lila', value: '#8b5cf6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Röd', value: '#ef4444' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
];

export function StageEditDialog({ open, onOpenChange, stage, onSave }: StageEditDialogProps) {
  const [name, setName] = useState(stage?.name || '');
  const [color, setColor] = useState(stage?.color || '#3b82f6');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!stage || !name.trim()) return;
    
    setSaving(true);
    try {
      await onSave(stage.id, name.trim(), color);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {stage?.id ? 'Redigera stadie' : 'Lägg till stadie'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Namn</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Intervju genomförd"
            />
          </div>

          <div className="space-y-2">
            <Label>Färg</Label>
            <div className="grid grid-cols-4 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  className={`h-10 rounded-md border-2 transition-all ${
                    color === preset.value 
                      ? 'border-foreground scale-110' 
                      : 'border-transparent hover:border-muted-foreground'
                  }`}
                  style={{ backgroundColor: preset.value }}
                  onClick={() => setColor(preset.value)}
                  title={preset.name}
                />
              ))}
            </div>
            
            <div className="flex gap-2 items-center mt-2">
              <Label htmlFor="custom-color">Egen färg:</Label>
              <input
                id="custom-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 rounded border cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Sparar...' : 'Spara'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
