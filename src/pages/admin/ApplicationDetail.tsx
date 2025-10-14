import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ArrowLeft, ExternalLink, Mail, Phone, FileText, Eye, Calendar, XCircle, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from '@/components/StarRating';
import { TagManager } from '@/components/TagManager';
import { InterviewBookingDialog } from '@/components/InterviewBookingDialog';
import { utcToStockholm } from '@/lib/timezone';

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
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [lastSavedNotes, setLastSavedNotes] = useState<Date | null>(null);

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
      setNotes(data.notes || '');

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

  const handleInterviewBooked = async (success: boolean) => {
    if (success) {
      await fetchApplication();
    }
  };

  const handleCancelInterview = async () => {
    const confirmed = window.confirm(
      'Är du säker på att du vill avboka intervjun? Kandidaten kommer att meddelas.'
    );
    
    if (!confirmed) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'viewed',
          interview_scheduled_at: null,
          interview_link: null,
          interview_notes: null,
          reminder_sent: false,
        })
        .eq('id', id);

      if (error) throw error;

      // Send cancellation email
      await supabase.functions.invoke('send-interview-cancellation', {
        body: {
          candidateName: application.candidate_name,
          candidateEmail: application.email,
          jobTitle: application.jobs?.title || 'denna position',
        },
      });

      await fetchApplication();
      
      toast({
        title: 'Intervju avbokad',
        description: 'Kandidaten har meddelats om avbokningen.',
      });
    } catch (error) {
      console.error('Error cancelling interview:', error);
      toast({
        title: 'Ett fel uppstod',
        description: 'Kunde inte avboka intervjutiden',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
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

  const saveNotes = useCallback(async (notesText: string) => {
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ notes: notesText })
        .eq('id', id);

      if (error) throw error;

      setApplication((prev: any) => ({ ...prev, notes: notesText }));
      setLastSavedNotes(new Date());
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Ett fel uppstod',
        description: 'Kunde inte spara anteckningar',
        variant: 'destructive',
      });
    } finally {
      setSavingNotes(false);
    }
  }, [id, toast]);

  // Debounce notes saving
  useEffect(() => {
    if (notes === (application?.notes || '')) return;
    
    const timer = setTimeout(() => {
      saveNotes(notes);
    }, 2000);

    return () => clearTimeout(timer);
  }, [notes, application?.notes, saveNotes]);

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
                <CardTitle>Anteckningar</CardTitle>
                <CardDescription>
                  Interna kommentarer om kandidaten
                  {lastSavedNotes && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      {savingNotes ? 'Sparar...' : `Sparat ${format(lastSavedNotes, 'HH:mm:ss', { locale: sv })}`}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Skriv anteckningar om kandidaten här..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[150px] resize-y"
                  disabled={savingNotes}
                />
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
                
                {!application.interview_scheduled_at && (
                  <InterviewBookingDialog
                    application={application}
                    onInterviewBooked={handleInterviewBooked}
                    disabled={updating}
                    mode="create"
                  />
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

            {/* Booked Interview Section */}
            {application.interview_scheduled_at && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Bokad intervju
                      </CardTitle>
                      <CardDescription>
                        {format(utcToStockholm(application.interview_scheduled_at), 'd MMMM yyyy, HH:mm', { locale: sv })}
                      </CardDescription>
                    </div>
                    <Badge variant="default" className="bg-blue-600">
                      Bokad
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {application.interview_link && (
                    <div>
                      <p className="text-sm font-medium mb-2">Videolänk</p>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={application.interview_link} target="_blank" rel="noopener noreferrer">
                          <Video className="w-4 h-4 mr-2" />
                          Öppna videolänk
                        </a>
                      </Button>
                    </div>
                  )}
                  
                  {application.interview_notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-1">Meddelande till kandidat</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {application.interview_notes}
                        </p>
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  <div className="flex flex-col gap-2">
                    <InterviewBookingDialog
                      application={application}
                      onInterviewBooked={handleInterviewBooked}
                      disabled={updating}
                      mode="edit"
                    />
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={handleCancelInterview}
                      disabled={updating}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Avboka intervjutid
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

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
