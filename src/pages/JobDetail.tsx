import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Building2, Clock, ArrowLeft, Send, Share2, Check, X, Mail } from "lucide-react";
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
import { trackMetaEvent } from "@/lib/metaPixel";
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { utcToStockholm } from '@/lib/timezone';
import { TipJobDialog } from "@/components/TipJobDialog";
import JobsHowItWorks from "@/components/JobsHowItWorks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const applicationSchema = z.object({
  name: z.string().trim().min(1, "Ange ditt namn").max(100, "Namnet kan vara max 100 tecken"),
  email: z.string().trim().min(1, "Ange en e-postadress").email("Ange en giltig e-postadress").max(255, "E-postadressen kan vara max 255 tecken"),
  phone: z.string().trim().min(1, "Ange ditt telefonnummer").max(20, "Telefonnumret kan vara max 20 tecken"),
  gdpr_consent: z.boolean().refine(val => val === true, {
    message: "Du måste godkänna behandling av personuppgifter för att kunna ansöka"
  }),
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
  const [tipJobDialogOpen, setTipJobDialogOpen] = useState(false);
  const [gdprPolicy, setGdprPolicy] = useState<string>("");
  const [showGdprDialog, setShowGdprDialog] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      gdpr_consent: false,
      website: "", // Honeypot field
    },
  });

  useEffect(() => {
    fetchJob();
  }, [slug, id]);

  // Fetch default pipeline stage
  useEffect(() => {
    fetchDefaultStage();
    fetchGdprPolicy();
  }, []);

  // Track job view when job is loaded
  useEffect(() => {
    if (job) {
      analytics.trackJobView(job.id, job.title);
      trackMetaEvent('ViewContent', {
        content_name: job.title,
        content_ids: [job.id],
        content_type: 'job',
      });
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

  const fetchGdprPolicy = async () => {
    try {
      const { data, error } = await supabase
        .from('gdpr_policies')
        .select('policy_text')
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('Error fetching GDPR policy:', error);
        return;
      }
      
      if (data) {
        setGdprPolicy(data.policy_text);
      }
    } catch (error) {
      console.error('Error in fetchGdprPolicy:', error);
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
        gdpr_consent: values.gdpr_consent,
        gdpr_consent_timestamp: new Date().toISOString(),
      };

      // Save application to database
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
          gdpr_consent: sanitizedData.gdpr_consent,
          gdpr_consent_timestamp: sanitizedData.gdpr_consent_timestamp,
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

      // Different flow for Getkiku jobs vs regular jobs
      if (job.kiku_interview_url) {
        // GETKIKU FLOW: Send Getkiku invitation email
        try {
          const { error: getkikuEmailError } = await supabase.functions.invoke('send-getkiku-invitation', {
            body: { 
              email: sanitizedData.email,
              candidateName: sanitizedData.name,
              phone: sanitizedData.phone,
              jobId: job.id
            }
          });
          
          if (getkikuEmailError) {
            console.error('Error sending Getkiku invitation:', getkikuEmailError);
          } else {
            console.log('Getkiku invitation email sent successfully');
          }
        } catch (emailError) {
          console.error('Failed to send Getkiku invitation:', emailError);
          // Continue anyway - application is saved
        }

        // Open Getkiku in new window immediately
        window.open(job.kiku_interview_url, '_blank');

        setIsSubmitted(true);
        analytics.trackApplicationSubmit(job.id, job.title, true);
        
        toast({
          title: "Perfekt! 🎉",
          description: "Vi har öppnat intervjufönstret och skickat en länk till din e-post.",
        });
      } else {
        // REGULAR JOB FLOW: Send standard confirmation emails
        try {
          const { error: emailError } = await supabase.functions.invoke('send-application-email', {
            body: { applicationId: application.id }
          });
          
          if (emailError) {
            console.error('Error sending emails:', emailError);
          } else {
            console.log('Application emails sent successfully');
          }
        } catch (emailError) {
          console.error('Failed to send application emails:', emailError);
          // Continue anyway - application is saved
        }

        setIsSubmitted(true);
        analytics.trackApplicationSubmit(job.id, job.title, true);
        
        toast({
          title: "Intervju bokad!",
          description: "Vi har skickat en bekräftelse till din e-post med detaljer om din intervju.",
        });
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

  const hideCompany = (job as any).hide_company_in_emails === true;

  // Generate SEO metadata
  const pageTitle = hideCompany
    ? `${job.title} | NoCV`
    : `${job.title} - ${job.companies?.name || 'Okänt företag'} | NoCV`;
  const pageDescription = job.description_md 
    ? job.description_md.replace(/[#*_\[\]]/g, '').trim().substring(0, 155) + '...'
    : hideCompany
      ? `Ansök till ${job.title} i ${job.city || 'Sverige'}. Sök jobb utan CV på NoCV.`
      : `Ansök till ${job.title} hos ${job.companies?.name || 'företaget'} i ${job.city || 'Sverige'}. Sök jobb utan CV på NoCV.`;

  // Generate structured data for JobPosting
  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description_md || job.title,
    "datePosted": job.publish_at || job.created_at,
    "validThrough": job.publish_at ? new Date(new Date(job.publish_at).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString() : undefined, // 90 days from publish
    "employmentType": job.employment_type?.toUpperCase() || "FULL_TIME",
    "hiringOrganization": hideCompany ? {
      "@type": "Organization",
      "name": "NoCV"
    } : {
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
        <meta property="og:image" content="https://nocv.se/images/og-default.jpg" />
        <meta property="og:locale" content="sv_SE" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://nocv.se/jobb/${job.slug}`} />
        
        {/* Structured Data - JobPosting */}
        <script type="application/ld+json">
          {JSON.stringify(jobPostingSchema)}
        </script>
        {/* Structured Data - Breadcrumb */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://nocv.se/" },
              { "@type": "ListItem", "position": 2, "name": "Lediga jobb", "item": "https://nocv.se/jobs" },
              { "@type": "ListItem", "position": 3, "name": job.title, "item": `https://nocv.se/jobb/${job.slug}` }
            ]
          })}
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
          
          {/* Company Logo */}
          {!hideCompany && job.companies?.logo_url && (
            <div className="mb-6">
              <img 
                src={job.companies.logo_url} 
                alt={`${job.companies.name} logotyp`}
                className="h-20 w-auto object-contain bg-white rounded-lg p-3 shadow-md"
              />
            </div>
          )}
          
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
              {!hideCompany && job.companies?.name && (
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
                  onClick={async () => {
                    const jobUrl = `https://nocv.se/jobb/${job.slug}`;
                    try {
                      await navigator.clipboard.writeText(jobUrl);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                      toast({ title: "Länk kopierad!", description: React.createElement('a', { href: jobUrl, target: '_blank', rel: 'noopener noreferrer', className: 'underline break-all text-primary hover:text-primary/80 select-all cursor-pointer' }, jobUrl) });
                    } catch {
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                      toast({ title: "Kopiera länken nedan:", description: React.createElement('a', { href: jobUrl, target: '_blank', rel: 'noopener noreferrer', className: 'underline break-all text-primary hover:text-primary/80 select-all cursor-pointer' }, jobUrl) });
                    }
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

                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 border-white/50 bg-white text-primary hover:bg-white/90 hover:border-white"
                  onClick={() => setTipJobDialogOpen(true)}
                >
                  💡 Tipsa en vän
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tip Job Dialog */}
      <TipJobDialog
        open={tipJobDialogOpen}
        onOpenChange={setTipJobDialogOpen}
        jobTitle={job.title}
        jobSlug={job.slug}
        companyName={job.companies?.name || ''}
        location={job.city || ''}
        jobId={job.id}
      />

      {/* GDPR Policy Dialog */}
      <Dialog open={showGdprDialog} onOpenChange={setShowGdprDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Behandling av personuppgifter (GDPR)</DialogTitle>
          </DialogHeader>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(gdprPolicy) }}
          />
          <Button
            onClick={() => setShowGdprDialog(false)}
            className="mt-4"
          >
            Stäng
          </Button>
        </DialogContent>
      </Dialog>

      {/* Job Details */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Job Description */}
              {(job.description_md || job.requirements_md) && (
                <Card className="bg-white border border-border">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading mb-4">Om tjänsten</h2>
                    <div 
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(
                          (job.description_md || '') + (job.requirements_md || '')
                        ) 
                      }}
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
                  <CardTitle className="text-xl font-heading">Boka intervju</CardTitle>
                </CardHeader>
                <CardContent>
                  {!showApplication ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Boka en AI-intervju med {hideCompany ? 'oss' : (job.companies?.name || 'företaget')} genom att fylla i dina uppgifter nedan.
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
                        Boka intervju
                      </Button>
                    </div>
                  ) : isSubmitted ? (
                    <div className="text-center py-4">
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        Snyggt!
                      </h4>
                      <p className="text-muted-foreground mb-4">
                        Du har tagit första steget. Om en minut landar ett mail i din inbox med en länk till din intervju. Den tar drygt 10 minuter och handlar om dina motorkunskaper — inga kuggfrågor, bara riktiga grejer du kan. Ingen ser dig, ingen dömer dig. Du svarar i din egen takt. Lycka till!
                      </p>
                      <p className="text-xs text-muted-foreground italic mb-4">
                        Hittar du inget mail? Kolla skräpposten — ibland hamnar det där.
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
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Du som hör på en motor om något är fel — det här är din chans. Vi har byggt en intervju som testar hur du tänker, inte hur du skriver. Inga CV, inga ansökningsbrev, inga konstigheter. Fyll i nedan så skickar vi en länk. Tar ungefär 10 minuter och du gör det när du vill — i soffan, på lunchen eller i verkstaden (vi skvallrar inte). Det är bara att köra igång när det passar dig 😊
                        </p>
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

                        {/* GDPR Consent */}
                        <FormField
                          control={form.control}
                          name="gdpr_consent"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 mt-1 cursor-pointer"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal cursor-pointer">
                                  Jag godkänner behandling av mina personuppgifter enligt GDPR.{" "}
                                  <button
                                    type="button"
                                    onClick={() => setShowGdprDialog(true)}
                                    className="text-primary underline hover:text-primary/80"
                                  >
                                    Läs mer om dataskydd
                                  </button>
                                </FormLabel>
                                <FormMessage />
                              </div>
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
                            {isLoading ? "Bokar..." : "Boka intervju"}
                          </Button>

                          <p className="text-sm text-muted-foreground font-bold italic text-center flex items-center justify-center gap-1">
                            <Mail className="w-3 h-3" />
                            OBS: Om du inte har fått ett mail om några minuter, kolla skräpkorgen!
                          </p>
                          
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
              <JobsHowItWorks />
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default JobDetail;