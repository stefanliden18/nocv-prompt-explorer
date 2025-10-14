import { useDraggable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/StarRating';
import { GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface KanbanCardProps {
  application: {
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
  };
  tags: Array<{ name: string }>;
}

export function KanbanCard({ application, tags }: KanbanCardProps) {
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
    if (!isDragging) {
      navigate(`/admin/applications/${application.id}`);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow bg-card"
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <div className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1 truncate">{application.candidate_name}</h4>
          
          <div className="mb-2">
            <StarRating 
              rating={application.rating || 0} 
              readonly 
              size="sm"
            />
          </div>

          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {displayTags.map((tag) => (
                <Badge key={tag.name} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge variant="outline" className="text-xs">
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
