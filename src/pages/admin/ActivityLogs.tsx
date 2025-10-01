import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Activity, Briefcase, FileText, TrendingUp, MousePointer, RefreshCw } from 'lucide-react';
import { analytics } from '@/lib/analytics';

interface ActivityLog {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  metadata: any;
  created_at: string;
}

interface AnalyticsEvent {
  event_type: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

const eventTypeLabels: Record<string, string> = {
  job_created: 'Jobb skapat',
  job_published: 'Jobb publicerat',
  job_updated: 'Jobb uppdaterat',
  application_submitted: 'Ansökan inskickad',
  application_status_changed: 'Ansökningsstatus ändrad',
  view_job: 'Visade jobb',
  click_apply: 'Klickade ansök',
  submit_application: 'Skickade ansökan',
  page_view: 'Sidvisning',
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
  const [frontendEvents, setFrontendEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
    fetchFrontendEvents();
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

  const fetchFrontendEvents = () => {
    try {
      const events = analytics.getStoredEvents();
      setFrontendEvents(events.reverse());
    } catch (error: any) {
      console.error('Error fetching frontend events:', error);
    }
  };

  const clearFrontendEvents = () => {
    analytics.clearStoredEvents();
    setFrontendEvents([]);
    toast.success('Frontend analytics rensade');
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
            <h1 className="text-3xl font-bold">Händelseloggar & Analytics</h1>
            <p className="text-muted-foreground">
              Övervaka system- och användarhändelser
            </p>
          </div>
          <Button variant="outline" onClick={() => {
            fetchLogs();
            fetchFrontendEvents();
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Uppdatera
          </Button>
        </div>

        <Tabs defaultValue="backend" className="space-y-4">
          <TabsList>
            <TabsTrigger value="backend" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Backend ({logs.length})
            </TabsTrigger>
            <TabsTrigger value="frontend" className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Frontend Analytics ({frontendEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="backend">

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
          </TabsContent>

          <TabsContent value="frontend">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Frontend Analytics</CardTitle>
                    <CardDescription>
                      Användarinteraktioner spårade i webbläsaren
                    </CardDescription>
                  </div>
                  {frontendEvents.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearFrontendEvents}>
                      Rensa alla
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {frontendEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Inga analytics-händelser ännu. Händelser spåras lokalt i webbläsaren.
                  </p>
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
                        {frontendEvents.map((event, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Badge variant="outline">
                                {eventTypeLabels[event.event_type] || event.event_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm space-y-1">
                                {event.properties?.job_title && (
                                  <div><strong>Jobb:</strong> {event.properties.job_title}</div>
                                )}
                                {event.properties?.page_path && (
                                  <div className="text-muted-foreground text-xs">
                                    {event.properties.page_path}
                                  </div>
                                )}
                                {event.properties?.success !== undefined && (
                                  <div className="text-xs">
                                    Status: {event.properties.success ? '✓ Lyckades' : '✗ Misslyckades'}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {event.timestamp && format(new Date(event.timestamp), "PPp", { locale: sv })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
