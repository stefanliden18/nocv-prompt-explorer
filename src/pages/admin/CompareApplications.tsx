import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ArrowLeft, ExternalLink, Mail, Phone, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from '@/components/StarRating';

const statusMap = {
  new: { label: 'Ny', variant: 'default' as const },
  viewed: { label: 'Sedd', variant: 'secondary' as const },
  booked: { label: 'Bokad', variant: 'default' as const },
  rejected: { label: 'Avvisad', variant: 'destructive' as const },
};

export default function CompareApplications() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    
    if (ids.length === 0) {
      toast({
        title: 'Inga kandidater valda',
        description: 'Välj minst 2 kandidater för att jämföra',
        variant: 'destructive',
      });
      navigate('/admin/applications');
      return;
    }

    if (ids.length > 4) {
      toast({
        title: 'För många kandidater',
        description: 'Max 4 kandidater kan jämföras samtidigt',
        variant: 'destructive',
      });
      return;
    }

    fetchApplications(ids);
  }, [searchParams]);

  const fetchApplications = async (ids: string[]) => {
    setLoading(true);
    try {
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            id,
            title,
            slug,
            companies (
              name
            )
          )
        `)
        .in('id', ids);

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
        `)
        .in('application_id', ids);

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
      navigate('/admin/applications');
    } finally {
      setLoading(false);
    }
  };

  const removeCandidate = (id: string) => {
    const ids = searchParams.get('ids')?.split(',').filter(appId => appId !== id) || [];
    
    if (ids.length < 2) {
      toast({
        title: 'För få kandidater',
        description: 'Minst 2 kandidater behövs för att jämföra',
      });
      navigate('/admin/applications');
      return;
    }

    setSearchParams({ ids: ids.join(',') });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[600px] w-full" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin/applications')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka till ansökningar
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Jämför {applications.length} kandidater
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-x-auto">
          {applications.map((app) => (
            <Card key={app.id} className="flex flex-col">
              <CardHeader className="relative pb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => removeCandidate(app.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardTitle className="pr-8">{app.candidate_name}</CardTitle>
                <div className="pt-2">
                  <StarRating rating={app.rating} readonly size="md" />
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">STATUS</p>
                  <Badge variant={statusMap[app.status as keyof typeof statusMap]?.variant || 'secondary'}>
                    {statusMap[app.status as keyof typeof statusMap]?.label || app.status}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">JOBB</p>
                  <p className="text-sm">{app.jobs?.title || 'Okänt jobb'}</p>
                  {app.jobs?.companies?.name && (
                    <p className="text-xs text-muted-foreground">{app.jobs.companies.name}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">ANSÖKT</p>
                  <p className="text-sm">{format(new Date(app.created_at), 'd MMM yyyy', { locale: sv })}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">KONTAKT</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <a href={`mailto:${app.email}`} className="text-xs text-primary hover:underline break-all">
                        {app.email}
                      </a>
                    </div>
                    {app.phone && (
                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <a href={`tel:${app.phone}`} className="text-xs text-primary hover:underline">
                          {app.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {app.tags && app.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">TAGGAR</p>
                      <div className="flex flex-wrap gap-1">
                        {app.tags.map((tag: any) => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {app.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">ANTECKNINGAR</p>
                      <p className="text-xs text-foreground line-clamp-4 whitespace-pre-wrap">
                        {app.notes}
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate(`/admin/applications/${app.id}`)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Öppna profil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
