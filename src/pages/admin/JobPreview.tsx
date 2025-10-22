import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { MapPin, Briefcase, Car } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PreviewHeader } from '@/components/PreviewHeader';

interface Job {
  id: string;
  title: string;
  description_md: string;
  requirements_md: string;
  city: string;
  region: string;
  employment_type: string;
  category: string;
  driver_license: boolean;
  publish_at: string;
  status: string;
  company_id: string;
  companies: {
    name: string;
    logo_url: string;
  };
}

export default function JobPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchJob(id);
    }
  }, [id]);

  const fetchJob = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            name,
            logo_url
          )
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <PreviewHeader jobId={id!} />
        <div className="min-h-screen bg-background pt-32">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-64 w-full mb-8" />
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <PreviewHeader jobId={id!} />
        <div className="min-h-screen bg-background flex items-center justify-center pt-32">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Jobbet hittades inte</h1>
            <Button onClick={() => navigate('/admin/jobs')}>
              Tillbaka till jobb
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>PREVIEW: {job.title} - {job.companies.name}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PreviewHeader jobId={id!} />

      <div className="min-h-screen bg-background pt-32">
        {/* Job Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {job.companies.logo_url && (
                <img
                  src={job.companies.logo_url}
                  alt={job.companies.name}
                  className="w-24 h-24 object-contain rounded-lg bg-background p-2 border"
                />
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-3">{job.title}</h1>
                <p className="text-xl text-muted-foreground mb-4">{job.companies.name}</p>
                
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  {job.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{job.city}</span>
                    </div>
                  )}
                  {job.employment_type && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>{job.employment_type}</span>
                    </div>
                  )}
                  {job.driver_license && (
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      <span>Körkort krävs</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Description */}
            {job.description_md && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Om tjänsten</h2>
                <div 
                  className="prose prose-lg max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(job.description_md) 
                  }}
                />
              </div>
            )}

            {/* Requirements */}
            {job.requirements_md && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Vi söker dig som</h2>
                <div 
                  className="prose prose-lg max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(job.requirements_md) 
                  }}
                />
              </div>
            )}

            {/* Application CTA */}
            <div className="mt-12 p-8 bg-primary/5 rounded-lg border">
              <h3 className="text-2xl font-bold mb-4">Intresserad?</h3>
              <p className="text-muted-foreground mb-6">
                I förhandsvisningsläge är ansökningsformuläret inaktiverat.
              </p>
              <Button size="lg" disabled>
                Ansök nu (inaktiverad i preview)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
