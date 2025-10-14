import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Trash2, GripVertical, Plus } from 'lucide-react';
import { StageEditDialog } from '@/components/StageEditDialog';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Stage {
  id: string;
  name: string;
  color: string;
  display_order: number;
}

interface StageManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStagesUpdated: () => void;
}

function SortableStageItem({ stage, onEdit, onDelete }: { 
  stage: Stage; 
  onEdit: (stage: Stage) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border rounded-lg"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: stage.color }}
      />

      <span className="flex-1 font-medium">{stage.name}</span>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(stage)}
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(stage.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function StageManagementDialog({ open, onOpenChange, onStagesUpdated }: StageManagementDialogProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (open) {
      fetchStages();
    }
  }, [open]);

  const fetchStages = async () => {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .order('display_order');

    if (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta stadier',
        variant: 'destructive',
      });
      return;
    }

    setStages(data || []);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);

    const newStages = arrayMove(stages, oldIndex, newIndex);
    setStages(newStages);

    // Update display_order in database
    const updates = newStages.map((stage, index) => ({
      id: stage.id,
      display_order: index + 1,
    }));

    for (const update of updates) {
      await supabase
        .from('pipeline_stages')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }

    onStagesUpdated();
    toast({
      title: 'Ordning uppdaterad',
      description: 'Stadierna har sorterats om',
    });
  };

  const handleAddStage = () => {
    setEditingStage({
      id: '',
      name: '',
      color: '#3b82f6',
      display_order: stages.length + 1,
    });
    setEditDialogOpen(true);
  };

  const handleEditStage = (stage: Stage) => {
    setEditingStage(stage);
    setEditDialogOpen(true);
  };

  const handleSaveStage = async (id: string, name: string, color: string) => {
    if (id) {
      // Update existing
      const { error } = await supabase
        .from('pipeline_stages')
        .update({ name, color })
        .eq('id', id);

      if (error) {
        toast({
          title: 'Fel',
          description: 'Kunde inte uppdatera stadie',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Uppdaterat',
        description: 'Stadiet har uppdaterats',
      });
    } else {
      // Create new
      const { error } = await supabase
        .from('pipeline_stages')
        .insert({
          name,
          color,
          display_order: stages.length + 1,
        });

      if (error) {
        toast({
          title: 'Fel',
          description: 'Kunde inte skapa stadie',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Skapat',
        description: 'Nytt stadie har lagts till',
      });
    }

    fetchStages();
    onStagesUpdated();
  };

  const handleDeleteStage = async (id: string) => {
    // Check if stage has applications
    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('pipeline_stage_id', id);

    if (count && count > 0) {
      toast({
        title: 'Kan inte ta bort',
        description: `Det finns ${count} kandidater i detta stadie. Flytta dem först.`,
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte ta bort stadie',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Borttaget',
      description: 'Stadiet har tagits bort',
    });

    fetchStages();
    onStagesUpdated();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hantera rekryteringsstadier</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Dra för att ändra ordning på stadierna
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={stages.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {stages.map((stage) => (
                    <SortableStageItem
                      key={stage.id}
                      stage={stage}
                      onEdit={handleEditStage}
                      onDelete={handleDeleteStage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleAddStage}
            >
              <Plus className="h-4 w-4 mr-2" />
              Lägg till nytt stadie
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StageEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        stage={editingStage}
        onSave={handleSaveStage}
      />
    </>
  );
}
