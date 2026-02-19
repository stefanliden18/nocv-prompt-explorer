import { cn } from '@/lib/utils';

type CandidateStatus = 'new' | 'reviewed' | 'proposal_sent' | 'interview_booked' | 'hired' | 'rejected';

const statusConfig: Record<CandidateStatus, { label: string; className: string }> = {
  new: { label: 'Ny', className: 'bg-blue-100 text-blue-800' },
  reviewed: { label: 'Granskad', className: 'bg-yellow-100 text-yellow-800' },
  proposal_sent: { label: 'Förslag skickat', className: 'bg-amber-100 text-amber-800' },
  interview_booked: { label: 'Intervju bokad', className: 'bg-nocv-orange/15 text-nocv-orange' },
  hired: { label: 'Anställd', className: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Avböjd', className: 'bg-red-100 text-red-800' },
};

export default function PortalStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as CandidateStatus] || { label: status, className: 'bg-muted text-muted-foreground' };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}
