import { Link } from 'react-router-dom';
import { User, Clock, ChevronRight } from 'lucide-react';
import PortalStatusBadge from './PortalStatusBadge';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface PortalCandidateCardProps {
  id: string;
  name: string;
  skillLevel: string | null;
  experienceYears: number | null;
  status: string;
  presentedAt: string | null;
}

const skillLabels: Record<string, string> = {
  junior: 'Junior',
  mid: 'Mellannivå',
  senior: 'Senior',
};

export default function PortalCandidateCard({
  id, name, skillLevel, experienceYears, status, presentedAt,
}: PortalCandidateCardProps) {
  return (
    <Link
      to={`/portal/candidates/${id}`}
      className="block bg-card rounded-xl p-5 shadow-card hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground group-hover:text-nocv-orange transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
              {skillLevel && <span>{skillLabels[skillLevel] || skillLevel}</span>}
              {experienceYears != null && (
                <>
                  <span>·</span>
                  <span>{experienceYears} års erfarenhet</span>
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-nocv-orange transition-colors shrink-0 mt-1" />
      </div>
      <div className="flex items-center justify-between mt-4">
        <PortalStatusBadge status={status} />
        {presentedAt && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(presentedAt), 'd MMM yyyy', { locale: sv })}
          </span>
        )}
      </div>
    </Link>
  );
}
