import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { KanbanColumn } from '@/components/KanbanColumn';
import { KanbanCard } from '@/components/KanbanCard';
import { AddColumnButton } from '@/components/AddColumnButton';
import { useState } from 'react';

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
  pipeline_stage_id: string;
  interview_scheduled_at?: string | null;
  interview_link?: string | null;
  jobs?: {
    title: string;
    companies?: {
      name: string;
    };
  };
}

interface KanbanBoardProps {
  stages: Stage[];
  applications: Application[];
  tags: Record<string, Array<{ name: string }>>;
  onDragEnd: (event: DragEndEvent) => void;
  onEditStage: (stage: Stage) => void;
  onDeleteStage: (stageId: string) => void;
  onAddStage: () => void;
}

export function KanbanBoard({ 
  stages, 
  applications, 
  tags,
  onDragEnd, 
  onEditStage, 
  onDeleteStage,
  onAddStage 
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    onDragEnd(event);
  };

  const handleMoveApplication = (applicationId: string, newStageId: string) => {
    const mockEvent: DragEndEvent = {
      active: { id: applicationId },
      over: { id: newStageId },
    } as DragEndEvent;
    
    onDragEnd(mockEvent);
  };

  const getApplicationsForStage = (stageId: string) => {
    return applications.filter(app => app.pipeline_stage_id === stageId);
  };

  const activeApplication = activeId 
    ? applications.find(app => app.id === activeId)
    : null;

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 px-2">
        {stages
          .sort((a, b) => a.display_order - b.display_order)
          .map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              applications={getApplicationsForStage(stage.id)}
              tags={tags}
              allStages={stages}
              onEditStage={onEditStage}
              onDeleteStage={onDeleteStage}
              onMoveApplication={handleMoveApplication}
            />
          ))}
        
        <AddColumnButton onClick={onAddStage} />
      </div>

      <DragOverlay>
        {activeApplication ? (
          <KanbanCard 
            application={activeApplication}
            tags={tags[activeApplication.id] || []}
            stages={stages}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
