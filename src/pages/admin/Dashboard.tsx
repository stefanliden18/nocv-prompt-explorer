import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Briefcase, FileText, Building2, Users, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface DashboardStats {
  jobs: number;
  applications: number;
  companies: number;
  users: number;
}

interface ActivityLog {
  id: string;
  event_type: string;
  entity_type: string;
  created_at: string;
  metadata: any;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ jobs: 0, applications: 0, companies: 0, users: 0 });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [jobsRes, appsRes, companiesRes, usersRes, activityRes] = await Promise.all([
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('applications').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

      setStats({
        jobs: jobsRes.count || 0,
        applications: appsRes.count || 0,
        companies: companiesRes.count || 0,
        users: usersRes.count || 0,
      });

      setActivities(activityRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('job')) return <Briefcase className="h-4 w-4" />;
    if (eventType.includes('application')) return <FileText className="h-4 w-4" />;
    if (eventType.includes('user')) return <Users className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getEventText = (activity: ActivityLog) => {
    const { event_type, metadata } = activity;
    
    switch (event_type) {
      case 'job_created':
        return `Nytt jobb skapades: ${metadata?.title || 'Okänt'}`;
      case 'job_published':
        return `Jobb publicerades: ${metadata?.title || 'Okänt'}`;
      case 'job_updated':
        return `Jobb uppdaterades: ${metadata?.title || 'Okänt'}`;
      case 'application_submitted':
        return `Ny ansökan från ${metadata?.candidate_name || 'Okänd'}`;
      case 'application_status_changed':
        return `Ansökan ändrades från ${metadata?.old_status || 'okänd'} till ${metadata?.status || 'okänd'}`;
      case 'user_role_changed':
        return `Användarroll ändrades från ${metadata?.old_role || 'okänd'} till ${metadata?.new_role || 'okänd'}`;
      default:
        return `${event_type}`;
    }
  };

  const getEventVariant = (eventType: string): "default" | "secondary" | "destructive" | "outline" => {
    if (eventType.includes('created') || eventType.includes('published')) return 'default';
    if (eventType.includes('updated') || eventType.includes('changed')) return 'secondary';
    return 'outline';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">NOCV Admin</h1>
          <p className="text-muted-foreground">Översikt över systemet</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt Jobb</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.jobs}</div>
              )}
              <p className="text-xs text-muted-foreground">Aktiva jobbannonser</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ansökningar</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.applications}</div>
              )}
              <p className="text-xs text-muted-foreground">Totalt ansökningar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Företag</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.companies}</div>
              )}
              <p className="text-xs text-muted-foreground">Registrerade företag</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Användare</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.users}</div>
              )}
              <p className="text-xs text-muted-foreground">Aktiva användare</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Senaste aktivitet</CardTitle>
            <CardDescription>Översikt över senaste händelserna i systemet</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen aktivitet ännu</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="mt-1 p-2 rounded-full bg-muted">
                      {getEventIcon(activity.event_type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{getEventText(activity)}</p>
                        <Badge variant={getEventVariant(activity.event_type)} className="text-xs">
                          {activity.event_type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: sv })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}