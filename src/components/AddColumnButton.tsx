import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AddColumnButtonProps {
  onClick: () => void;
}

export function AddColumnButton({ onClick }: AddColumnButtonProps) {
  return (
    <Card className="flex-shrink-0 w-80 border-dashed hover:border-primary transition-colors">
      <Button
        variant="ghost"
        className="w-full h-full min-h-[500px] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
        onClick={onClick}
      >
        <Plus className="h-8 w-8" />
        <span className="text-sm font-medium">Lägg till kolumn</span>
      </Button>
    </Card>
  );
}
