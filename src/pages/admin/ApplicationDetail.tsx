import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ArrowLeft, ExternalLink, Mail, Phone, FileText, Eye, Calendar, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from '@/components/StarRating';
import { TagManager } from '@/components/TagManager';

const statusMap = {
  new: { label: 'Ny', variant: 'default' as const },
  viewed: { label: 'Sedd', variant: 'secondary' as const },
  booked: { label: 'Bokad', variant: 'default' as const },
  rejected: { label: 'Avvisad', variant: 'destructive' as const },
};

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
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
        .eq('id', id)
        .single();

      if (error) throw error;
      setApplication(data);

      // Fetch tags
      await fetchTags();

      // Mark as viewed if it's new
      if (data.status === 'new') {
        await updateStatus('viewed');
      }
    } catch (error) {
      console.error('Error fetching application:', error);
      toast({
        title: 'Ett fel uppstod',
        description: 'Kunde inte hämta ansökan',
        variant: 'destructive',
      });
      navigate('/admin/applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('application_tag_relations')
        .select(`
          tag_id,
          application_tags (
            id,
            name
          )
        `)
        .eq('application_id', id);

      if (error) throw error;
      setTags(data?.map(item => item.application_tags).filter(Boolean) || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const updateStatus = async (newStatus: 'new' | 'viewed' | 'booked' | 'rejected') => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setApplication((prev: any) => ({ ...prev, status: newStatus }));
      
      toast({
        title: 'Status uppdaterad',
        description: `Ansökan markerad som ${statusMap[newStatus as keyof typeof statusMap]?.label.toLowerCase()}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Ett fel uppstod',
        description: 'Kunde inte uppdatera status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const updateRating = async (rating: number) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ rating })
        .eq('id', id);

      if (error) throw error;

      setApplication((prev: any) => ({ ...prev, rating }));
      
      toast({
        title: 'Rating uppdaterad',
        description: `Kandidat bedömd med ${rating} stjärnor`,
      });
    } catch (error) {
      console.error('Error updating rating:', error);
      toast({
        title: 'Ett fel uppstod',
        description: 'Kunde inte uppdatera rating',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/applications')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{application.candidate_name}</h1>
            <p className="text-muted-foreground">
              Ansökan till {application.jobs?.title || 'Okänt jobb'}
            </p>
            <p className="text-sm text-muted-foreground">
              Mottagen {format(new Date(application.created_at), 'd MMMM yyyy, HH:mm', { locale: sv })}
            </p>
          </div>
          <Badge variant={statusMap[application.status as keyof typeof statusMap]?.variant || 'secondary'}>
            {statusMap[application.status as keyof typeof statusMap]?.label || application.status}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Kontaktinformation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">E-post</p>
                  <a href={`mailto:${application.email}`} className="text-sm text-primary hover:underline">
                    {application.email}
                  </a>
                </div>
              </div>

              {application.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Telefon</p>
                    <a href={`tel:${application.phone}`} className="text-sm text-primary hover:underline">
                      {application.phone}
                    </a>
                  </div>
                </div>
              )}

              {application.message && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Meddelande</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {application.message}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {application.cv_url && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-2">CV</p>
                      <Button variant="outline" size="sm" asChild>
                        <a href={application.cv_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Öppna CV
                        </a>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rating & Taggar</CardTitle>
                <CardDescription>Betygsätt och märk kandidaten</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Betyg</p>
                  <StarRating
                    rating={application.rating}
                    onRatingChange={updateRating}
                    size="lg"
                  />
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Taggar</p>
                  <TagManager
                    applicationId={application.id}
                    currentTags={tags}
                    onTagsChange={fetchTags}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Åtgärder</CardTitle>
                <CardDescription>Hantera ansökan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {application.status !== 'viewed' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => updateStatus('viewed')}
                    disabled={updating}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Markera som sedd
                  </Button>
                )}
                
                {application.status !== 'booked' && (
                  <Button 
                    variant="default" 
                    className="w-full justify-start"
                    onClick={() => updateStatus('booked')}
                    disabled={updating}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Boka intervju
                  </Button>
                )}
                
                {application.status !== 'rejected' && (
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start"
                    onClick={() => updateStatus('rejected')}
                    disabled={updating}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Avslå
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Jobbinformation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Jobbtitel</p>
                  <p className="text-sm text-foreground">{application.jobs?.title || 'Okänt jobb'}</p>
                </div>
                {application.jobs?.companies?.name && (
                  <div>
                    <p className="text-sm font-medium mb-1">Företag</p>
                    <p className="text-sm text-foreground">{application.jobs.companies.name}</p>
                  </div>
                )}
                {application.jobs?.slug && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={`/jobb/${application.jobs.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Se jobbannons
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
