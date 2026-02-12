import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JobWithMeta {
  id: string;
  title: string;
  status: string;
  company_name: string | null;
  application_count: number;
}

interface JobFilterChipsProps {
  jobs: JobWithMeta[];
  selectedJobIds: string[];
  onToggleJob: (jobId: string) => void;
  onClearAll: () => void;
}

const STATUS_GROUPS: { key: string; label: string; statuses: string[]; color: string; selectedClass: string; hoverClass: string }[] = [
  {
    key: 'active',
    label: 'Aktiva',
    statuses: ['published'],
    color: 'bg-green-500',
    selectedClass: 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/40 dark:text-green-300 dark:border-green-600',
    hoverClass: 'hover:bg-green-50 dark:hover:bg-green-900/20',
  },
  {
    key: 'inactive',
    label: 'Vilande',
    statuses: ['inactive'],
    color: 'bg-yellow-500',
    selectedClass: 'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-600',
    hoverClass: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
  },
  {
    key: 'draft',
    label: 'Utkast',
    statuses: ['draft'],
    color: 'bg-muted-foreground/50',
    selectedClass: 'bg-muted border-muted-foreground/50 text-muted-foreground dark:bg-muted dark:text-muted-foreground',
    hoverClass: 'hover:bg-muted/60',
  },
];

export function JobFilterChips({ jobs, selectedJobIds, onToggleJob, onClearAll }: JobFilterChipsProps) {
  const groupedJobs = STATUS_GROUPS.map(group => ({
    ...group,
    jobs: jobs.filter(j => group.statuses.includes(j.status)),
  })).filter(group => group.jobs.length > 0);

  const hasSelection = selectedJobIds.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Filtrera på jobb</h3>
        {hasSelection && (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 text-xs">
            Visa alla jobb
          </Button>
        )}
      </div>

      {groupedJobs.map(group => (
        <div key={group.key} className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', group.color)} />
            <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {group.jobs.map(job => {
              const isSelected = selectedJobIds.includes(job.id);
              return (
                <button
                  key={job.id}
                  onClick={() => onToggleJob(job.id)}
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer',
                    isSelected
                      ? group.selectedClass
                      : `border-border bg-background text-foreground/70 ${group.hoverClass}`,
                    !hasSelection && 'border-border bg-background text-foreground/70'
                  )}
                >
                  {job.title}
                  <span className={cn(
                    'ml-1.5 text-[10px] font-semibold',
                    isSelected ? 'opacity-80' : 'opacity-50'
                  )}>
                    ({job.application_count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
