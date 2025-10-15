import { useDroppable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KanbanCard } from '@/components/KanbanCard';
import { Edit2, Trash2 } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  color: string;
  display_order: number;
}

interface Application {
  id: string;
  candidate_name: string;
  rating: number | null;
  job_id: string;
  jobs?: {
    title: string;
    companies?: {
      name: string;
    };
  };
}

interface KanbanColumnProps {
  stage: Stage;
  applications: Application[];
  tags: Record<string, Array<{ name: string }>>;
  onEditStage: (stage: Stage) => void;
  onDeleteStage: (stageId: string) => void;
}

export function KanbanColumn({ 
  stage, 
  applications, 
  tags,
  onEditStage, 
  onDeleteStage 
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <Card 
      className={`flex-shrink-0 w-72 sm:w-80 flex flex-col transition-colors ${
        isOver ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div 
        className="p-3 border-b flex items-center justify-between"
        style={{ 
          backgroundColor: `${stage.color}15`,
          borderTopColor: stage.color,
          borderTopWidth: '3px'
        }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="font-semibold text-sm">
            {stage.name} ({applications.length})
          </h3>
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEditStage(stage)}
          >
            <Edit2 className="h-2.5 w-2.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDeleteStage(stage.id)}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className="p-3 overflow-y-auto flex-1 min-h-[400px] max-h-[calc(100vh-350px)]"
      >
        {[...applications]
          .sort((a, b) => {
            // Null ratings hamnar sist
            if (a.rating === null && b.rating === null) return 0;
            if (a.rating === null) return 1;
            if (b.rating === null) return -1;
            // Högst rating först
            return b.rating - a.rating;
          })
          .map((application) => (
            <KanbanCard
              key={application.id}
              application={application}
              tags={tags[application.id] || []}
            />
          ))}
      </div>
    </Card>
  );
}
