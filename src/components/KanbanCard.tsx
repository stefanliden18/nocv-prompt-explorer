import { useDraggable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StarRating } from '@/components/StarRating';
import { GripVertical, Calendar, ExternalLink, MoveRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { utcToStockholm } from '@/lib/timezone';

interface KanbanCardProps {
  application: {
    id: string;
    candidate_name: string;
    rating: number | null;
    job_id: string;
    interview_scheduled_at?: string | null;
    interview_link?: string | null;
    is_demo?: boolean;
    jobs?: {
      title: string;
      companies?: {
        name: string;
      };
    };
  };
  tags: Array<{ name: string }>;
  stages?: Array<{ id: string; name: string; color: string }>;
  onMoveToStage?: (applicationId: string, stageId: string) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function KanbanCard({ application, tags, stages, onMoveToStage, selectionMode, selected, onToggleSelect }: KanbanCardProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: application.id });

  const style = {
    transform: transform 
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)` 
      : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const displayTags = tags.slice(0, 3);
  const remainingCount = tags.length - 3;

  const handleClick = () => {
    if (isDragging) return;
    if (selectionMode && onToggleSelect) {
      onToggleSelect(application.id);
      return;
    }
    navigate(`/admin/applications/${application.id}`);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative p-1.5 sm:p-2 mb-1 sm:mb-1.5 cursor-pointer hover:shadow-md transition-shadow bg-card",
        application.interview_scheduled_at && "border-l-4 border-l-blue-500"
      )}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      {/* Move button - endast mobil */}
      {stages && onMoveToStage && (
        <div className="md:hidden absolute top-1 right-1 z-10">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6"
                onClick={(e) => e.stopPropagation()}
              >
                <MoveRight className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-1">
                <p className="text-xs font-semibold mb-2">Flytta till:</p>
                {stages.map((stage) => (
                  <Button
                    key={stage.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveToStage(application.id, stage.id);
                    }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full mr-2" 
                      style={{ backgroundColor: stage.color }}
                    />
                    {stage.name}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      <div className="flex items-start gap-1 sm:gap-2">
        {selectionMode && (
          <div className="mt-1" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect?.(application.id)}
              className="h-4 w-4"
            />
          </div>
        )}
        {!selectionMode && (
          <div className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hidden md:block">
            <GripVertical className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-xs sm:text-sm truncate">{application.candidate_name}</h4>
            {application.is_demo && (
              <Badge className="bg-yellow-500 text-black font-bold text-[10px]">DEMO</Badge>
            )}
          </div>
          
          <div className="mb-1.5 sm:mb-2">
            <StarRating 
              rating={application.rating || 0} 
              readonly 
              size="xs"
            />
          </div>

          {application.interview_scheduled_at && (
            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded mb-1.5">
              <Calendar className="h-2.5 w-2.5" />
              <span className="font-medium">
                {format(utcToStockholm(application.interview_scheduled_at), 'd MMM, HH:mm', { locale: sv })}
              </span>
              {application.interview_link && (
                <ExternalLink className="h-2.5 w-2.5 ml-1" />
              )}
            </div>
          )}

          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {displayTags.map((tag) => (
                <Badge key={tag.name} variant="secondary" className="text-[10px] sm:text-xs">
                  {tag.name}
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  +{remainingCount}
                </Badge>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground truncate">
            {application.jobs?.title}
            {application.jobs?.companies?.name && ` - ${application.jobs.companies.name}`}
          </p>
        </div>
      </div>
    </Card>
  );
}
