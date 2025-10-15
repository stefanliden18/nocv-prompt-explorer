import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Download, Eye, GitCompare, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApplicationFilters } from '@/components/ApplicationFilters';
import { StarRating } from '@/components/StarRating';

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
  const [minRating, setMinRating] = useState<number>(1);
  const [maxRating, setMaxRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      // Fetch applications
      const { data: appsData, error: appsError } = await supabase
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

      if (appsError) throw appsError;

      // Fetch tags for all applications
      const { data: tagsData, error: tagsError } = await supabase
        .from('application_tag_relations')
        .select(`
          application_id,
          application_tags (
            id,
            name
          )
        `);

      if (tagsError) throw tagsError;

      // Combine applications with their tags
      const applicationsWithTags = (appsData || []).map(app => ({
        ...app,
        tags: tagsData
          ?.filter(rel => rel.application_id === app.id)
          .map(rel => rel.application_tags)
          .filter(Boolean) || []
      }));

      setApplications(applicationsWithTags);
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

  const filteredApplications = applications.filter(app => {
    // Status filter
    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false;
    }

    // Rating filter
    const appRating = app.rating || 0;
    if (appRating > 0 && (appRating < minRating || appRating > maxRating)) {
      return false;
    }

    // Tag filter (all selected tags must be present)
    if (selectedTags.length > 0) {
      const appTagIds = (app.tags || []).map((t: any) => t.id);
      const hasAllTags = selectedTags.every(selectedTag => 
        appTagIds.includes(selectedTag.id)
      );
      if (!hasAllTags) {
        return false;
      }
    }

    return true;
  });

  const toggleSelectAll = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(filteredApplications.map(app => app.id));
    }
  };

  const toggleSelectApplication = (id: string) => {
    setSelectedApplications(prev => 
      prev.includes(id) ? prev.filter(appId => appId !== id) : [...prev, id]
    );
  };

  const handleCompare = () => {
    if (selectedApplications.length < 2) {
      toast({
        title: 'För få kandidater',
        description: 'Välj minst 2 kandidater för att jämföra',
        variant: 'destructive',
      });
      return;
    }

    if (selectedApplications.length > 4) {
      toast({
        title: 'För många kandidater',
        description: 'Max 4 kandidater kan jämföras samtidigt',
        variant: 'destructive',
      });
      return;
    }

    navigate(`/admin/applications/compare?ids=${selectedApplications.join(',')}`);
  };

  const exportToCSV = () => {
    const headers = ['Datum', 'Jobbtitel', 'Kandidat', 'E-post', 'Telefon', 'Status', 'Rating', 'Taggar', 'Meddelande', 'CV-länk'];
    const rows = filteredApplications.map(app => [
      format(new Date(app.created_at), 'yyyy-MM-dd HH:mm', { locale: sv }),
      app.jobs?.title || 'Okänt jobb',
      app.candidate_name,
      app.email,
      app.phone || '-',
      statusMap[app.status as keyof typeof statusMap]?.label || app.status,
      app.rating ? `${app.rating}/5` : '-',
      app.tags?.map((t: any) => t.name).join(', ') || '-',
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
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Ansökningar</h1>
            <p className="text-sm text-muted-foreground">Hantera alla ansökningar</p>
          </div>
          <Button onClick={exportToCSV} variant="outline" disabled={filteredApplications.length === 0} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Exportera CSV
          </Button>
        </div>

        <ApplicationFilters
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          minRating={minRating}
          maxRating={maxRating}
          onRatingChange={(min, max) => {
            setMinRating(min);
            setMaxRating(max);
          }}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          applicationCounts={{
            total: applications.length,
            new: applications.filter(a => a.status === 'new').length,
            viewed: applications.filter(a => a.status === 'viewed').length,
            booked: applications.filter(a => a.status === 'booked').length,
            rejected: applications.filter(a => a.status === 'rejected').length,
          }}
        />

        {selectedApplications.length > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {selectedApplications.length} {selectedApplications.length === 1 ? 'kandidat' : 'kandidater'} valda
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedApplications([])}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Rensa urval
                  </Button>
                </div>
                <Button
                  onClick={handleCompare}
                  disabled={selectedApplications.length < 2 || selectedApplications.length > 4}
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Jämför valda ({selectedApplications.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Jobbtitel</TableHead>
                        <TableHead>Kandidat</TableHead>
                        <TableHead>E-post</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Taggar</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Åtgärder</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((app) => (
                        <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedApplications.includes(app.id)}
                              onCheckedChange={() => toggleSelectApplication(app.id)}
                            />
                          </TableCell>
                          <TableCell onClick={() => navigate(`/admin/applications/${app.id}`)} className="font-medium">
                            {format(new Date(app.created_at), 'd MMM yyyy', { locale: sv })}
                          </TableCell>
                          <TableCell onClick={() => navigate(`/admin/applications/${app.id}`)}>
                            {app.jobs?.title || 'Okänt jobb'}
                          </TableCell>
                          <TableCell onClick={() => navigate(`/admin/applications/${app.id}`)}>
                            {app.candidate_name}
                          </TableCell>
                          <TableCell onClick={() => navigate(`/admin/applications/${app.id}`)}>
                            {app.email}
                          </TableCell>
                          <TableCell onClick={() => navigate(`/admin/applications/${app.id}`)}>
                            {app.phone || '-'}
                          </TableCell>
                          <TableCell onClick={() => navigate(`/admin/applications/${app.id}`)}>
                            <StarRating rating={app.rating} readonly size="sm" />
                          </TableCell>
                          <TableCell onClick={() => navigate(`/admin/applications/${app.id}`)}>
                            <div className="flex flex-wrap gap-1">
                              {app.tags?.slice(0, 3).map((tag: any) => (
                                <Badge key={tag.id} variant="outline" className="text-xs">
                                  {tag.name}
                                </Badge>
                              ))}
                              {app.tags?.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{app.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell onClick={() => navigate(`/admin/applications/${app.id}`)}>
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
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {filteredApplications.map((app) => (
                    <Card 
                      key={app.id} 
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/admin/applications/${app.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{app.candidate_name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{app.jobs?.title}</p>
                        </div>
                        <Checkbox
                          checked={selectedApplications.includes(app.id)}
                          onCheckedChange={() => toggleSelectApplication(app.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="ml-2"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={app.rating} readonly size="xs" />
                        <Badge variant={statusMap[app.status as keyof typeof statusMap]?.variant}>
                          {statusMap[app.status as keyof typeof statusMap]?.label}
                        </Badge>
                      </div>
                      
                      {app.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {app.tags?.slice(0, 2).map((tag: any) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                          {app.tags?.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{app.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{format(new Date(app.created_at), 'd MMM yyyy', { locale: sv })}</span>
                        <span className="truncate ml-2">{app.email}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}