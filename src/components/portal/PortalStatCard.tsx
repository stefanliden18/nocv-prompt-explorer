import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortalStatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'orange' | 'blue' | 'green';
}

const colorMap = {
  orange: 'bg-nocv-orange/10 text-nocv-orange',
  blue: 'bg-primary/10 text-primary',
  green: 'bg-emerald-500/10 text-emerald-600',
};

export default function PortalStatCard({ title, value, icon: Icon, color = 'blue' }: PortalStatCardProps) {
  return (
    <div className="bg-card rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-heading font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', colorMap[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
