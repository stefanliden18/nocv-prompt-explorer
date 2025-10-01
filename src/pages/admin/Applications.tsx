import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Download, Eye, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusMap = {
  new: { label: 'Ny', variant: 'default' as const },
  viewed: { label: 'Sedd', variant: 'secondary' as const },
  booked: { label: 'Bokad', variant: 'default' as const },
  rejected: { label: 'Avvisad', variant: 'destructive' as const },
};

export default function AdminApplications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            id,
            title,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Ett fel uppstod',
        description: 'Kunde inte hämta ansökningar',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = statusFilter === 'all' 
    ? applications 
    : applications.filter(app => app.status === statusFilter);

  const exportToCSV = () => {
    const headers = ['Datum', 'Jobbtitel', 'Kandidat', 'E-post', 'Telefon', 'Status', 'Meddelande', 'CV-länk'];
    const rows = filteredApplications.map(app => [
      format(new Date(app.created_at), 'yyyy-MM-dd HH:mm', { locale: sv }),
      app.jobs?.title || 'Okänt jobb',
      app.candidate_name,
      app.email,
      app.phone || '-',
      statusMap[app.status as keyof typeof statusMap]?.label || app.status,
      app.message || '-',
      app.cv_url || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ansokningar_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export lyckades',
      description: `${filteredApplications.length} ansökningar exporterades till CSV`,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Ansökningar</h1>
            <p className="text-muted-foreground">Hantera alla ansökningar</p>
          </div>
          <Button onClick={exportToCSV} variant="outline" disabled={filteredApplications.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportera CSV
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrera status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla ({applications.length})</SelectItem>
              <SelectItem value="new">Nya ({applications.filter(a => a.status === 'new').length})</SelectItem>
              <SelectItem value="viewed">Sedda ({applications.filter(a => a.status === 'viewed').length})</SelectItem>
              <SelectItem value="booked">Bokade ({applications.filter(a => a.status === 'booked').length})</SelectItem>
              <SelectItem value="rejected">Avvisade ({applications.filter(a => a.status === 'rejected').length})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {statusFilter === 'all' ? 'Alla ansökningar' : `${statusMap[statusFilter as keyof typeof statusMap]?.label || statusFilter} ansökningar`}
            </CardTitle>
            <CardDescription>
              Visar {filteredApplications.length} av {applications.length} ansökningar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Inga ansökningar hittades
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Jobbtitel</TableHead>
                    <TableHead>Kandidat</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/applications/${app.id}`)}>
                      <TableCell className="font-medium">
                        {format(new Date(app.created_at), 'd MMM yyyy', { locale: sv })}
                      </TableCell>
                      <TableCell>{app.jobs?.title || 'Okänt jobb'}</TableCell>
                      <TableCell>{app.candidate_name}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>{app.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[app.status as keyof typeof statusMap]?.variant || 'secondary'}>
                          {statusMap[app.status as keyof typeof statusMap]?.label || app.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/applications/${app.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}