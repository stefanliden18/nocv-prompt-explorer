import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { HelmetProvider, Helmet } from 'react-helmet-async';

export default function CandidatePresentation() {
  const { token } = useParams();
  const [presentation, setPresentation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPresentation();
  }, [token]);

  const fetchPresentation = async () => {
    if (!token) {
      setError('Ogiltig länk');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('candidate_presentations')
        .select(`
          id,
          presentation_html,
          status,
          published_at,
          applications (
            candidate_name
          )
        `)
        .eq('share_token', token)
        .eq('status', 'published')
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Presentationen hittades inte eller är inte tillgänglig');
        setLoading(false);
        return;
      }

      setPresentation(data);
    } catch (err) {
      console.error('Error fetching presentation:', err);
      setError('Kunde inte ladda presentationen');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Sidan kunde inte visas</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!presentation?.presentation_html) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Ingen presentation</h1>
          <p className="text-muted-foreground">Presentationen har inget innehåll</p>
        </div>
      </div>
    );
  }

  const candidateName = presentation.applications?.candidate_name || 'Kandidat';

  return (
    <HelmetProvider>
      <Helmet>
        <title>Kandidatpresentation - {candidateName}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div 
        className="min-h-screen"
        dangerouslySetInnerHTML={{ __html: presentation.presentation_html }}
      />
    </HelmetProvider>
  );
}
