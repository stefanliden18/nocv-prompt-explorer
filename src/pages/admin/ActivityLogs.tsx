import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Activity, Briefcase, FileText, TrendingUp } from 'lucide-react';

interface ActivityLog {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  metadata: any;
  created_at: string;
}

const eventTypeLabels: Record<string, string> = {
  job_created: 'Jobb skapat',
  job_published: 'Jobb publicerat',
  job_updated: 'Jobb uppdaterat',
  application_submitted: 'Ansökan inskickad',
  application_status_changed: 'Ansökningsstatus ändrad',
};

const eventTypeIcons: Record<string, any> = {
  job_created: Briefcase,
  job_published: TrendingUp,
  job_updated: Briefcase,
  application_submitted: FileText,
  application_status_changed: FileText,
};

const eventTypeColors: Record<string, string> = {
  job_created: 'default',
  job_published: 'default',
  job_updated: 'secondary',
  application_submitted: 'default',
  application_status_changed: 'secondary',
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('event_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      toast.error('Kunde inte hämta händelseloggar');
    } finally {
      setLoading(false);
    }
  };

  const getEventBadgeVariant = (eventType: string) => {
    const color = eventTypeColors[eventType] || 'default';
    return color as "default" | "secondary" | "destructive" | "outline";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Händelselogg</h1>
            <p className="text-muted-foreground">
              Historik över händelser i systemet
            </p>
          </div>
          <Activity className="h-8 w-8 text-muted-foreground" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Senaste aktiviteter</CardTitle>
                <CardDescription>
                  De 100 senaste händelserna
                </CardDescription>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrera händelser" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla händelser</SelectItem>
                  <SelectItem value="job_created">Jobb skapade</SelectItem>
                  <SelectItem value="job_published">Jobb publicerade</SelectItem>
                  <SelectItem value="application_submitted">Ansökningar</SelectItem>
                  <SelectItem value="application_status_changed">Statusändringar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Laddar händelser...</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Inga händelser ännu.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Händelse</TableHead>
                      <TableHead>Detaljer</TableHead>
                      <TableHead>Datum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const Icon = eventTypeIcons[log.event_type] || Activity;
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <Badge variant={getEventBadgeVariant(log.event_type)}>
                                {eventTypeLabels[log.event_type] || log.event_type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              {log.metadata?.title && (
                                <div className="font-medium">{log.metadata.title}</div>
                              )}
                              {log.metadata?.candidate_name && (
                                <div>
                                  <span className="text-muted-foreground">Kandidat: </span>
                                  {log.metadata.candidate_name}
                                </div>
                              )}
                              {log.metadata?.email && (
                                <div className="text-muted-foreground text-xs">
                                  {log.metadata.email}
                                </div>
                              )}
                              {log.metadata?.old_status && log.metadata?.status && (
                                <div className="text-muted-foreground text-xs">
                                  {log.metadata.old_status} → {log.metadata.status}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(log.created_at), "PPp", { locale: sv })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
