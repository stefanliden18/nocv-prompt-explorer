import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Building2, Clock, Users, ArrowLeft, Send } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

// Mock job data (same as Jobs.tsx - ideally this would come from a shared data source)
const mockJobs = [
  {
    id: 1,
    title: "Bilmekaniker",
    location: "Stockholm",
    industry: "Fordon",
    company: "AutoService AB",
    description: "Erfaren bilmekaniker sökes till vårt team.",
    fullDescription: "Vi söker en erfaren bilmekaniker som vill vara en del av vårt växande team. Du kommer att arbeta med service, reparationer och underhåll av personbilar och lätta lastbilar. Vi erbjuder en trygg arbetsmiljö, kompetensutveckling och konkurrenskraftiga villkor.",
    requirements: [
      "Gymnasieutbildning inom fordon eller motsvarande erfarenhet",
      "Minst 3 års erfarenhet av bilreparationer", 
      "Körkort B",
      "Goda kunskaper i svenska"
    ],
    responsibilities: [
      "Service och underhåll av fordon",
      "Felsökning och reparationer",
      "Kvalitetskontroll av utfört arbete",
      "Kundkontakt vid behov"
    ],
    benefits: [
      "Konkurrenskraftiga villkor",
      "Kompetensutveckling",
      "Trygg arbetsmiljö",
      "Kollektivavtal"
    ],
    employmentType: "Heltid",
    startDate: "Enligt överenskommelse"
  },
  {
    id: 2,
    title: "Svetsare",
    location: "Göteborg", 
    industry: "Tillverkning",
    company: "MetallTeknik Sverige",
    description: "Kvalificerad svetsare för industriella projekt.",
    fullDescription: "Vi söker en kompetent svetsare för våra industriella projekt inom stålkonstruktioner. Du kommer att arbeta med både MIG/MAG och TIG-svetsning på olika material och tjocklekar.",
    requirements: [
      "Svetsutbildning eller motsvarande erfarenhet",
      "Minst 2 års erfarenhet av MIG/MAG svetsning",
      "TIG-svetsning är meriterande",
      "Svenskt svetsarcertifikat"
    ],
    responsibilities: [
      "Svetsning enligt ritningar",
      "Kvalitetskontroll",
      "Materialhantering",
      "Säkerhet på arbetsplatsen"
    ],
    benefits: [
      "Schemalagt arbetstid",
      "Utbildningsmöjligheter", 
      "Moderna verktyg",
      "Utvecklingsmöjligheter"
    ],
    employmentType: "Heltid",
    startDate: "Snarast"
  },
  {
    id: 3,
    title: "Tekniker",
    location: "Malmö",
    industry: "Elektronik",
    company: "TechSolutions Nordic",
    description: "Elektroniktekniker med erfarenhet av reparationer.",
    fullDescription: "Vi söker en elektroniktekniker för service och reparation av elektronisk utrustning. Du kommer att arbeta både i verkstad och ute hos kunder med felsökning och reparationer.",
    requirements: [
      "Teknisk utbildning inom elektronik",
      "Erfarenhet av felsökning",
      "Körkort B",
      "Engelska i tal och skrift"
    ],
    responsibilities: [
      "Reparation av elektronik",
      "Kundservice",
      "Dokumentation",
      "Teknisk support"
    ],
    benefits: [
      "Flexibla arbetstider",
      "Tjänstebil",
      "Teknisk utveckling",
      "Bonussystem"
    ],
    employmentType: "Heltid",
    startDate: "Enligt överenskommelse"
  },
  {
    id: 4,
    title: "Maskinoperatör",
    location: "Stockholm",
    industry: "Tillverkning",
    company: "Industrial Works",
    description: "Operatör för CNC-maskiner och produktionsutrustning.",
    fullDescription: "Vi söker en maskinoperatör för våra CNC-maskiner och produktionsutrustning. Du kommer att arbeta i skift och ansvara för att produktionen löper smidigt.",
    requirements: [
      "Teknisk utbildning eller motsvarande",
      "Erfarenhet av CNC-maskiner",
      "Skiftarbete",
      "Noggrannhet och precision"
    ],
    responsibilities: [
      "Köra CNC-maskiner",
      "Kvalitetskontroll",
      "Underhållsarbete",
      "Produktionsrapportering"
    ],
    benefits: [
      "Skifttillägg",
      "Utbildning",
      "Trygg anställning",
      "Utvecklingsmöjligheter"
    ],
    employmentType: "Heltid",
    startDate: "Enligt överenskommelse"
  },
  {
    id: 5,
    title: "Lacktekniker",
    location: "Uppsala",
    industry: "Fordon",
    company: "CarPaint Specialists",
    description: "Lacktekniker för bilar och industriella ändamål.",
    fullDescription: "Vi söker en erfaren lacktekniker för bilreparationer och industriell lackning. Du kommer att arbeta med både partial- och helrenovering av fordon.",
    requirements: [
      "Utbildning inom lackteknik",
      "Minst 3 års erfarenhet",
      "Kunskap om färgblandning",
      "Kvalitetstänk"
    ],
    responsibilities: [
      "Lackning av fordon",
      "Färgblandning",
      "Maskeringsarbete",
      "Kvalitetskontroll"
    ],
    benefits: [
      "Moderna lokaler",
      "Kompetensutveckling",
      "Konkurrenskraftiga villkor",
      "Utvecklingsmöjligheter"
    ],
    employmentType: "Heltid",
    startDate: "Snarast"
  },
  {
    id: 6,
    title: "Elektriker",
    location: "Göteborg",
    industry: "Elektro",
    company: "ElektroNord AB",
    description: "Behörig elektriker för installations- och servicearbeten.",
    fullDescription: "Vi söker en behörig elektriker för installations- och servicearbeten inom både industri och bostäder. Du kommer att arbeta självständigt och i team med varierande projekt.",
    requirements: [
      "Elektrikerutbildning",
      "Behörighet",
      "Körkort B",
      "Servicesinne"
    ],
    responsibilities: [
      "Elinstallationer",
      "Service och underhåll",
      "Felsökning",
      "Kundkontakt"
    ],
    benefits: [
      "Tjänstebil",
      "Flexibilitet",
      "Kompetensutveckling",
      "Utvecklingsmöjligheter"
    ],
    employmentType: "Heltid", 
    startDate: "Enligt överenskommelse"
  }
];

const applicationSchema = z.object({
  name: z.string().min(1, "Ange ditt namn"),
  email: z.string().min(1, "Ange en e-postadress").email("Ange en giltig e-postadress"),
  phone: z.string().min(1, "Ange ditt telefonnummer"),
  coverLetter: z.string().min(1, "Berätta varför du är rätt person för jobbet"),
});

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
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
      coverLetter: "",
    },
  });

  useEffect(() => {
    const jobId = parseInt(id || "0");
    const foundJob = mockJobs.find(j => j.id === jobId);
    
    if (foundJob) {
      setJob(foundJob);
    } else {
      navigate("/jobs");
    }
  }, [id, navigate]);

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
          company: `Ansökan till: ${job.title} - ${job.company}`,
          message: `Telefon: ${values.phone}\n\nPersonligt brev:\n${values.coverLetter}`,
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
        title: "Ansökan skickad!",
        description: "Vi återkommer till dig inom kort.",
      });
      
    } catch (error: any) {
      console.error('Error sending application:', error);
      
      // Create fallback mailto link
      const subject = `Ansökan till ${job.title} - ${job.company}`;
      const body = `Namn: ${values.name}
E-post: ${values.email}
Telefon: ${values.phone}

Personligt brev:
${values.coverLetter}`;
      
      const mailtoLink = `mailto:michael@nocv.se?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      toast({
        title: "Öppnar e-postklient",
        description: "Vi öppnar din e-postklient som backup för din ansökan.",
        variant: "destructive",
      });
      
      // Open mailto as fallback
      window.open(mailtoLink, '_blank');
      
    } finally {
      setIsLoading(false);
    }
  };

  if (!job) {
    return null;
  }

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
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {job.industry}
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white">
                {job.employmentType}
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4 leading-tight">
              {job.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-lg opacity-90">
              <div className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                {job.company}
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {job.location}
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Tillträde: {job.startDate}
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
              {/* Description */}
              <Card className="bg-white border border-border">
                <CardHeader>
                  <CardTitle className="text-2xl font-heading">Om tjänsten</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed text-lg">
                    {job.fullDescription}
                  </p>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card className="bg-white border border-border">
                <CardHeader>
                  <CardTitle className="text-2xl font-heading">Vad vi söker</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {job.requirements.map((req: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-foreground">{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Responsibilities */}
              <Card className="bg-white border border-border">
                <CardHeader>
                  <CardTitle className="text-2xl font-heading">Arbetsuppgifter</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {job.responsibilities.map((resp: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-foreground">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card className="bg-white border border-border">
                <CardHeader>
                  <CardTitle className="text-2xl font-heading">Vad vi erbjuder</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {job.benefits.map((benefit: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white border border-border sticky top-6">
                <CardHeader>
                  <CardTitle className="text-xl font-heading">Ansök nu</CardTitle>
                </CardHeader>
                <CardContent>
                  {!showApplication ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Skicka in din ansökan för att komma i kontakt med {job.company}.
                      </p>
                      <Button 
                        className="w-full"
                        variant="cta-primary"
                        onClick={() => setShowApplication(true)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Ansök till tjänsten
                      </Button>
                    </div>
                  ) : isSubmitted ? (
                    <div className="text-center py-4">
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        Tack för din ansökan!
                      </h4>
                      <p className="text-muted-foreground mb-4">
                        Vi återkommer till dig inom kort.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setIsSubmitted(false);
                          setShowApplication(false);
                          form.reset();
                        }}
                      >
                        Ny ansökan
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
                        
                        <FormField
                          control={form.control}
                          name="coverLetter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Personligt brev *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Berätta varför du är rätt person för denna tjänst..."
                                  className="min-h-[100px] resize-none"
                                  {...field} 
                                />
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
                            {isLoading ? "Skickar..." : "Skicka ansökan"}
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