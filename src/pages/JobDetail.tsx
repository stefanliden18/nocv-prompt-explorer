import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Building2, Clock, ArrowLeft, Send } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from 'react-markdown';

const applicationSchema = z.object({
  name: z.string().min(1, "Ange ditt namn"),
  email: z.string().min(1, "Ange en e-postadress").email("Ange en giltig e-postadress"),
  phone: z.string().min(1, "Ange ditt telefonnummer"),
});

const JobDetail = () => {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApplication, setShowApplication] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    fetchJob();
  }, [slug, id]);

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
    setIsLoading(true);
    
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase är inte korrekt konfigurerat');
      }

      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: values.name,
          email: values.email,
          company: `Intervjubokning: ${job.title} - ${job.companies?.name || 'Okänt företag'}`,
          message: `Telefon: ${values.phone}\n\nKandidaten vill boka en AI-intervju för denna tjänst.`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setIsSubmitted(true);
      toast({
        title: "Intervju bokad!",
        description: "Vi återkommer till dig inom kort med detaljer om AI-intervjun.",
      });
      
    } catch (error: any) {
      console.error('Error sending application:', error);
      
      // Create fallback mailto link
      const subject = `Intervjubokning: ${job.title} - ${job.companies?.name || 'Okänt företag'}`;
      const body = `Namn: ${values.name}
E-post: ${values.email}
Telefon: ${values.phone}

Kandidaten vill boka en AI-intervju för denna tjänst.`;
      
      const mailtoLink = `mailto:michael@nocv.se?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      toast({
        title: "Öppnar e-postklient",
        description: "Vi öppnar din e-postklient som backup för din intervjubokning.",
        variant: "destructive",
      });
      
      // Open mailto as fallback
      window.open(mailtoLink, '_blank');
      
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

  return (
    <div className="min-h-screen bg-background">
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
                  Publicerad: {new Date(job.publish_at).toLocaleDateString('sv-SE')}
                </div>
              )}
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
                    <div className="prose prose-sm max-w-none text-foreground">
                      <ReactMarkdown>{job.description_md}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Requirements */}
              {job.requirements_md && (
                <Card className="bg-white border border-border">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading mb-4">Krav och kvalifikationer</h2>
                    <div className="prose prose-sm max-w-none text-foreground">
                      <ReactMarkdown>{job.requirements_md}</ReactMarkdown>
                    </div>
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
                        Boka en AI-intervju för att visa dina praktiska färdigheter för {job.companies?.name || 'företaget'}.
                      </p>
                      <Button 
                        className="w-full"
                        variant="cta-primary"
                        onClick={() => setShowApplication(true)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Boka intervju
                      </Button>
                    </div>
                  ) : isSubmitted ? (
                    <div className="text-center py-4">
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        Tack för din bokning!
                      </h4>
                      <p className="text-muted-foreground mb-4">
                        Vi återkommer till dig inom kort med detaljer om AI-intervjun.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setIsSubmitted(false);
                          setShowApplication(false);
                          form.reset();
                        }}
                      >
                        Ny bokning
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
                         
                        <div className="space-y-2">
                          <Button 
                            type="submit"
                            className="w-full"
                            variant="cta-primary"
                            disabled={isLoading}
                          >
                            {isLoading ? "Bokar..." : "Boka intervju"}
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