import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Building2, Clock, ArrowLeft, Send, Share2, Check, Mail } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from 'isomorphic-dompurify';
import { analytics } from "@/lib/analytics";
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { utcToStockholm } from '@/lib/timezone';
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
  website: z.string().max(0, "Detta fält ska vara tomt").optional(),
});

const DemoJobDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApplication, setShowApplication] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [defaultStageId, setDefaultStageId] = useState<string | null>(null);
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
      website: "",
    },
  });

  useEffect(() => {
    fetchJob();
  }, [slug]);

  useEffect(() => {
    fetchDefaultStage();
    fetchGdprPolicy();
  }, []);

  useEffect(() => {
    if (job) {
      analytics.trackJobView(job.id, `[DEMO] ${job.title}`);
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
      console.log('=== [DemoJobDetail] START ===');
      console.log('[DemoJobDetail] Current URL:', window.location.href);
      console.log('[DemoJobDetail] Slug from params:', slug);
      
      if (!slug) {
        console.error('[DemoJobDetail] ❌ ERROR: No slug provided');
        toast({
          title: "Fel",
          description: "Ingen slug hittades i URL:en",
          variant: "destructive"
        });
        navigate('/demo');
        return;
      }

      console.log('[DemoJobDetail] 🔍 Fetching demo job with slug:', slug);

      const { data, error } = await supabase
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
        .eq('status', 'demo')
        .eq('slug', slug)
        .maybeSingle();

      console.log('[DemoJobDetail] 📊 Query result:', { 
        hasData: !!data, 
        hasError: !!error,
        dataTitle: data?.title,
        errorMessage: error?.message 
      });

      if (error) {
        console.error('[DemoJobDetail] ❌ ERROR fetching job:', error);
        toast({
          title: "Databasfel",
          description: `Kunde inte hämta demo-jobb: ${error.message}`,
          variant: "destructive"
        });
        navigate('/demo');
        return;
      }
      
      if (!data) {
        console.error('[DemoJobDetail] ❌ ERROR: No job found with slug:', slug);
        console.log('[DemoJobDetail] Redirecting to demo...');
        toast({
          title: "Demo-jobb hittades inte",
          description: `Inget demo-jobb finns med sluggen: ${slug}`,
          variant: "destructive"
        });
        navigate('/demo');
        return;
      }

      console.log('[DemoJobDetail] ✅ SUCCESS: Job found!');
      console.log('[DemoJobDetail] Job title:', data.title);
      console.log('[DemoJobDetail] Job company:', data.companies?.name);
      console.log('=== [DemoJobDetail] END ===');
      
      setJob(data);
    } catch (error: any) {
      console.error('[DemoJobDetail] ⚠️ EXCEPTION caught:', error);
      console.error('[DemoJobDetail] Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      });
      toast({
        title: "Ett oväntat fel uppstod",
        description: "Kunde inte ladda demo-jobbet. Kontrollera konsolen för mer info.",
        variant: "destructive"
      });
      navigate('/demo');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof applicationSchema>) => {
    if (values.website && values.website.trim() !== "") {
      console.warn('Bot detected - honeypot field filled');
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte boka intervjutid. Försök igen.",
        variant: "destructive",
      });
      return;
    }

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
      const sanitizedData = {
        name: DOMPurify.sanitize(values.name, { ALLOWED_TAGS: [] }),
        email: DOMPurify.sanitize(values.email, { ALLOWED_TAGS: [] }),
        phone: DOMPurify.sanitize(values.phone, { ALLOWED_TAGS: [] }),
        job_id: job.id,
        pipeline_stage_id: defaultStageId,
        gdpr_consent: values.gdpr_consent,
        gdpr_consent_timestamp: new Date().toISOString(),
      };

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
        
        analytics.trackApplicationSubmit(job.id, `[DEMO] ${job.title}`, false);
        return;
      }

      console.log('Demo application saved successfully:', application);

      if (job.kiku_interview_url) {
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
          }
        } catch (emailError) {
          console.error('Failed to send Getkiku invitation:', emailError);
        }

        window.open(job.kiku_interview_url, '_blank');
        setIsSubmitted(true);
        analytics.trackApplicationSubmit(job.id, `[DEMO] ${job.title}`, true);
        
        toast({
          title: "Perfekt! 🎉",
          description: "Vi har öppnat intervjufönstret och skickat en länk till din e-post.",
        });
      } else {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-application-email', {
            body: { applicationId: application.id }
          });
          
          if (emailError) {
            console.error('Error sending emails:', emailError);
          }
        } catch (emailError) {
          console.error('Failed to send application emails:', emailError);
        }

        setIsSubmitted(true);
        analytics.trackApplicationSubmit(job.id, `[DEMO] ${job.title}`, true);
        
        toast({
          title: "Intervju bokad!",
          description: "Vi har skickat en bekräftelse till din e-post med detaljer om din intervju.",
        });
      }
      
    } catch (error: any) {
      console.error('Error sending application:', error);
      analytics.trackApplicationSubmit(job.id, `[DEMO] ${job.title}`, false);
      
      toast({
        title: "Ett fel uppstod",
        description: error.message || "Kunde inte boka intervjutid. Försök igen senare.",
        variant: "destructive",
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackNavigation = () => {
    // Force navigation to /demo with replace to avoid back button issues
    navigate('/demo', { replace: true });
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

  const pageTitle = hideCompany
    ? `[DEMO] ${job.title} | NoCV`
    : `[DEMO] ${job.title} - ${job.companies?.name || 'Okänt företag'} | NoCV`;
  const pageDescription = `Detta är ett demojobb för säljpresentationer.`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Navigation />
      
      <section className="pt-24 pb-12 bg-gradient-hero text-white">
        <div className="container mx-auto px-6">
          <Button
            variant="ghost"
            className="mb-6 text-white hover:bg-white/10"
            onClick={handleBackNavigation}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
          
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
              <Badge className="bg-yellow-500 text-black font-bold">
                🎬 DEMO
              </Badge>
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

            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Dela demojobbet:</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 border-white/50 bg-white text-primary hover:bg-white/90 hover:border-white"
                  onClick={async () => {
                    const jobUrl = `${window.location.origin}/demo/${job.slug}`;
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
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="lg:col-span-2 space-y-8">
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
                          analytics.trackJobApplyClick(job.id, `[DEMO] ${job.title}`);
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

                          <p className="text-xs text-muted-foreground italic text-center flex items-center justify-center gap-1">
                            <Mail className="w-3 h-3" />
                            En intervjulänk skickas till din e-post. Kolla skräpposten om mailet dröjer.
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
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default DemoJobDetail;
