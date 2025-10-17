import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Building2, Clock, ArrowLeft, Send, Share2, Check } from "lucide-react";
import { 
  LinkedinShareButton, 
  FacebookShareButton, 
  TwitterShareButton, 
  WhatsappShareButton,
  LinkedinIcon,
  FacebookIcon,
  XIcon,
  WhatsappIcon 
} from 'react-share';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'isomorphic-dompurify';
import { analytics } from "@/lib/analytics";
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { utcToStockholm } from '@/lib/timezone';

const applicationSchema = z.object({
  name: z.string().trim().min(1, "Ange ditt namn").max(100, "Namnet kan vara max 100 tecken"),
  email: z.string().trim().min(1, "Ange en e-postadress").email("Ange en giltig e-postadress").max(255, "E-postadressen kan vara max 255 tecken"),
  phone: z.string().trim().min(1, "Ange ditt telefonnummer").max(20, "Telefonnumret kan vara max 20 tecken"),
  // Honeypot field for bot protection
  website: z.string().max(0, "Detta fält ska vara tomt").optional(),
});

const JobDetail = () => {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApplication, setShowApplication] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [defaultStageId, setDefaultStageId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "", // Honeypot field
    },
  });

  useEffect(() => {
    fetchJob();
  }, [slug, id]);

  // Fetch default pipeline stage
  useEffect(() => {
    fetchDefaultStage();
  }, []);

  // Track job view when job is loaded
  useEffect(() => {
    if (job) {
      analytics.trackJobView(job.id, job.title);
    }
  }, [job]);

  const fetchDefaultStage = async () => {
    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('is_default', true)
        .single();
      
      if (error) {
        console.error('Error fetching default stage:', error);
        return;
      }
      
      if (data) {
        setDefaultStageId(data.id);
      }
    } catch (error) {
      console.error('Error in fetchDefaultStage:', error);
    }
  };

  const fetchJob = async () => {
    setLoading(true);
    try {
      // Support both slug and id for backward compatibility
      if (!slug && !id) {
        navigate('/jobs');
        return;
      }

      let query = supabase
        .from('jobs')
        .select(`
          *,
          companies (
            id,
            name,
            logo_url,
            website
          )
        `)
        .eq('status', 'published');

      if (slug) {
        query = query.eq('slug', slug);
      } else if (id) {
        query = query.eq('id', id);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      
      if (!data) {
        navigate('/jobs');
        return;
      }

      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof applicationSchema>) => {
    // Bot protection - check honeypot
    if (values.website && values.website.trim() !== "") {
      console.warn('Bot detected - honeypot field filled');
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte boka intervjutid. Försök igen.",
        variant: "destructive",
      });
      return;
    }

    // Validate that default stage is loaded
    if (!defaultStageId) {
      console.error('No default stage found');
      toast({
        title: "Systemfel",
        description: "Kunde inte ladda pipeline-inställningar. Kontakta support.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Sanitize user input before sending
      const sanitizedData = {
        name: DOMPurify.sanitize(values.name, { ALLOWED_TAGS: [] }),
        email: DOMPurify.sanitize(values.email, { ALLOWED_TAGS: [] }),
        phone: DOMPurify.sanitize(values.phone, { ALLOWED_TAGS: [] }),
        job_id: job.id,
        pipeline_stage_id: defaultStageId,
      };

      // Save directly to database instead of using edge function
      const { data: application, error: insertError } = await supabase
        .from('applications')
        .insert({
          candidate_name: sanitizedData.name,
          email: sanitizedData.email,
          phone: sanitizedData.phone || null,
          job_id: sanitizedData.job_id,
          pipeline_stage_id: sanitizedData.pipeline_stage_id,
          status: 'new',
          message: null,
          cv_url: null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error saving application:', insertError);
        
        // Handle rate limiting errors specifically
        if (insertError.message.includes('För många försök')) {
          toast({
            title: "För många försök",
            description: "Vänta minst 10 minuter mellan ansökningar med samma e-postadress.",
            variant: "destructive",
          });
        } else if (insertError.message.includes('Daglig gräns')) {
          toast({
            title: "Daglig gräns uppnådd",
            description: "Du kan skicka maximalt 10 ansökningar per dag.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Ett fel uppstod",
            description: "Kunde inte skicka din ansökan. Försök igen senare.",
            variant: "destructive",
          });
        }
        
        analytics.trackApplicationSubmit(job.id, job.title, false);
        return;
      }

      console.log('Application saved successfully:', application);

      setIsSubmitted(true);
      
      // Track successful application submission
      analytics.trackApplicationSubmit(job.id, job.title, true);
      
      toast({
        title: "Intervju bokad!",
        description: "Vi har skickat en bekräftelse till din e-post med detaljer om din intervju.",
      });

      // Redirect to GetKiku interview if URL is set
      if (job.kiku_interview_url) {
        setTimeout(() => {
          window.location.href = job.kiku_interview_url;
        }, 2000); // Wait 2 seconds so user can see the success message
      }
      
    } catch (error: any) {
      console.error('Error sending application:', error);
      
      // Track failed application submission
      analytics.trackApplicationSubmit(job.id, job.title, false);
      
      toast({
        title: "Ett fel uppstod",
        description: error.message || "Kunde inte boka intervjutid. Försök igen senare.",
        variant: "destructive",
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <section className="pt-24 pb-12">
          <div className="container mx-auto px-6">
            <Skeleton className="h-12 w-48 mb-6" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        </section>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const employmentTypes: Record<string, string> = {
    full_time: 'Heltid',
    part_time: 'Deltid',
    contract: 'Konsult',
    temporary: 'Vikariat'
  };

  // Generate SEO metadata
  const pageTitle = `${job.title} - ${job.companies?.name || 'Okänt företag'} | NOCV`;
  const pageDescription = job.description_md 
    ? job.description_md.replace(/[#*_\[\]]/g, '').trim().substring(0, 155) + '...'
    : `Ansök till ${job.title} hos ${job.companies?.name || 'företaget'} i ${job.city || 'Sverige'}. Sök jobb utan CV på NOCV.`;

  // Generate structured data for JobPosting
  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description_md || job.title,
    "datePosted": job.publish_at || job.created_at,
    "validThrough": job.publish_at ? new Date(new Date(job.publish_at).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString() : undefined, // 90 days from publish
    "employmentType": job.employment_type?.toUpperCase() || "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.companies?.name || "Okänt företag",
      "sameAs": job.companies?.website || undefined,
      "logo": job.companies?.logo_url || undefined
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.city || "Sverige",
        "addressCountry": "SE"
      }
    },
    "baseSalary": job.category ? {
      "@type": "MonetaryAmount",
      "currency": "SEK",
      "value": {
        "@type": "QuantitativeValue",
        "unitText": "MONTH"
      }
    } : undefined,
    "industry": job.category,
    "qualifications": job.requirements_md,
    "responsibilities": job.description_md,
    "url": `https://nocv.se/jobb/${job.slug}`
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`https://nocv.se/jobb/${job.slug}`} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://nocv.se/jobb/${job.slug}`} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(jobPostingSchema)}
        </script>
      </Helmet>

      <Navigation />
      
      {/* Header */}
      <section className="pt-24 pb-12 bg-gradient-hero text-white">
        <div className="container mx-auto px-6">
          <Button
            variant="ghost"
            className="mb-6 text-white hover:bg-white/10"
            onClick={() => navigate("/jobs")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till lediga jobb
          </Button>
          
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {job.category && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {job.category}
                </Badge>
              )}
              {job.employment_type && (
                <Badge variant="outline" className="border-white/30 text-white">
                  {employmentTypes[job.employment_type] || job.employment_type}
                </Badge>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4 leading-tight">
              {job.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-lg opacity-90">
              {job.companies?.name && (
                <div className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  {job.companies.name}
                </div>
              )}
              {job.city && (
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  {job.city}
                </div>
              )}
              {job.publish_at && (
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Publicerad: {format(utcToStockholm(job.publish_at), 'PPP', { locale: sv })}
                </div>
              )}
            </div>

            {/* Social Sharing */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Dela jobbet:</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <LinkedinShareButton
                  url={`https://nocv.se/jobb/${job.slug}`}
                  title={`${job.title} hos ${job.companies?.name || 'företaget'}`}
                  summary={job.description_md?.substring(0, 200) || ''}
                >
                  <LinkedinIcon size={40} round className="hover:opacity-80 transition-opacity" />
                </LinkedinShareButton>

                <FacebookShareButton
                  url={`https://nocv.se/jobb/${job.slug}`}
                  hashtag="#jobb"
                >
                  <FacebookIcon size={40} round className="hover:opacity-80 transition-opacity" />
                </FacebookShareButton>

                <TwitterShareButton
                  url={`https://nocv.se/jobb/${job.slug}`}
                  title={`${job.title} hos ${job.companies?.name || 'företaget'}`}
                  hashtags={['jobb', 'karriär']}
                >
                  <XIcon size={40} round className="hover:opacity-80 transition-opacity" />
                </TwitterShareButton>

                <WhatsappShareButton
                  url={`https://nocv.se/jobb/${job.slug}`}
                  title={`${job.title} hos ${job.companies?.name || 'företaget'}`}
                >
                  <WhatsappIcon size={40} round className="hover:opacity-80 transition-opacity" />
                </WhatsappShareButton>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 border-white/50 bg-white text-primary hover:bg-white/90 hover:border-white"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://nocv.se/jobb/${job.slug}`);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                    toast({
                      title: "Länk kopierad!",
                      description: "Jobblänken har kopierats till urklipp.",
                    });
                  }}
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Kopierad!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Kopiera länk
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Details */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Job Description */}
              {job.description_md && (
                <Card className="bg-white border border-border">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading mb-4">Om tjänsten</h2>
                    <div 
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description_md) }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Requirements */}
              {job.requirements_md && (
                <Card className="bg-white border border-border">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading mb-4">Vad vi söker</h2>
                    <div 
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.requirements_md) }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Additional Info */}
              {(job.language || job.driver_license) && (
                <Card className="bg-white border border-border">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading mb-4">Övrig information</h2>
                    <div className="space-y-2 text-foreground">
                      {job.language && (
                        <p><strong>Språk:</strong> {job.language}</p>
                      )}
                      {job.driver_license && (
                        <p><strong>Körkort:</strong> Krävs</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white border border-border sticky top-6">
                <CardHeader>
                  <CardTitle className="text-xl font-heading">Boka tid för intervju</CardTitle>
                </CardHeader>
                <CardContent>
                  {!showApplication ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Boka en AI-intervju med {job.companies?.name || 'företaget'} genom att fylla i dina uppgifter nedan.
                      </p>
                      <Button 
                        className="w-full"
                        variant="cta-primary"
                        onClick={() => {
                          setShowApplication(true);
                          analytics.trackJobApplyClick(job.id, job.title);
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Boka tid för intervju
                      </Button>
                    </div>
                  ) : isSubmitted ? (
                    <div className="text-center py-4">
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        Intervju bokad!
                      </h4>
                      <p className="text-muted-foreground mb-4">
                        Vi har skickat en bekräftelse till din e-post. Du kommer snart få information om när din AI-intervju äger rum.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setIsSubmitted(false);
                          setShowApplication(false);
                          form.reset();
                        }}
                      >
                        Stäng
                      </Button>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Namn *</FormLabel>
                              <FormControl>
                                <Input placeholder="Ditt namn" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-post *</FormLabel>
                              <FormControl>
                                <Input placeholder="din@epost.se" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon *</FormLabel>
                              <FormControl>
                                <Input placeholder="070-123 45 67" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Honeypot field - hidden from real users */}
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem className="hidden">
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input 
                                  tabIndex={-1}
                                  autoComplete="off"
                                  {...field} 
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                         
                        <div className="space-y-2">
                          <Button 
                            type="submit"
                            className="w-full"
                            variant="cta-primary"
                            disabled={isLoading}
                          >
                            {isLoading ? "Bokar..." : "Boka tid för intervju"}
                          </Button>
                          
                          <Button 
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={() => setShowApplication(false)}
                          >
                            Avbryt
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default JobDetail;