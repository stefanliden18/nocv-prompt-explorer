import { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Briefcase } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface DemoJob {
  id: string;
  slug: string;
  title: string;
  city: string | null;
  category: string | null;
  description_md: string | null;
  company_id: string;
  companies: {
    name: string;
    logo_url: string | null;
  } | null;
}

const Demo = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<DemoJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDemoJobs();
  }, []);

  const fetchDemoJobs = async () => {
    setLoading(true);
    try {
      console.log('[Demo] Fetching demo jobs...');
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          slug,
          title,
          city,
          category,
          description_md,
          company_id,
          companies (
            name,
            logo_url
          )
        `)
        .eq('status', 'demo')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Demo] Error fetching demo jobs:', error);
        throw error;
      }

      console.log('[Demo] Found demo jobs:', data?.length || 0);
      setJobs(data || []);
    } catch (error) {
      console.error('[Demo] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntroText = (description: string | null) => {
    if (!description) return "Ingen beskrivning tillgänglig.";
    
    let text = description.replace(/<[^>]*>/g, '');
    text = text.replace(/[#*_\[\]]/g, '');
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    text = text.replace(/\s+/g, ' ').trim();
    
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  const handleJobClick = (slug: string) => {
    console.log('[Demo] Navigating to demo job:', slug);
    navigate(`/demo/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Demo-jobb | NoCV - Testa vår plattform</title>
        <meta name="description" content="Utforska våra demo-jobb och se hur NoCV:s rekryteringsplattform fungerar. Testa att ansöka utan CV." />
        <meta property="og:title" content="Demo-jobb | NoCV" />
        <meta property="og:description" content="Utforska våra demo-jobb och se hur NoCV:s rekryteringsplattform fungerar." />
        <link rel="canonical" href="https://nocv.se/demo" />
      </Helmet>

      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4 text-sm font-medium">
              <Briefcase className="w-4 h-4 mr-2" />
              Demo-jobb
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-foreground mb-4">
              Testa NoCV:s plattform
            </h1>
            <p className="text-xl text-muted-foreground">
              Här kan du utforska demo-jobb och se hur vår rekryteringsplattform fungerar. 
              Testa att ansöka utan CV och upplev hur enkelt det är!
            </p>
          </div>
        </div>
      </section>

      {/* Demo Jobs Grid */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-white border border-border">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                Inga demo-jobb är tillgängliga just nu.
              </p>
              <Button onClick={() => navigate('/jobs')} variant="default">
                Visa riktiga lediga jobb
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {jobs.map((job) => (
                <Card 
                  key={job.id}
                  className="bg-white border border-border hover:shadow-card transition-all duration-300 hover:transform hover:scale-[1.02] flex flex-col h-full cursor-pointer"
                  onClick={() => handleJobClick(job.slug)}
                >
                  <CardHeader className="pb-4">
                    {/* Company Logo */}
                    {job.companies?.logo_url && (
                      <div className="mb-3 flex justify-center">
                        <img 
                          src={job.companies.logo_url} 
                          alt={`${job.companies.name} logotyp`}
                          className="h-12 w-auto object-contain"
                        />
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2 mb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-xl font-semibold text-foreground font-heading line-clamp-2">
                          {job.title}
                        </CardTitle>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 shrink-0">
                          Demo
                        </Badge>
                      </div>
                      {job.category && (
                        <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20 w-fit">
                          {job.category}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4 mr-1 shrink-0" />
                      {job.city || 'Ej angiven'}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 flex-grow">
                    <p className="text-muted-foreground text-sm mb-3 font-medium">
                      {job.companies?.name || 'Okänt företag'}
                    </p>
                    <p className="text-foreground leading-relaxed line-clamp-4">
                      {getIntroText(job.description_md)}
                    </p>
                  </CardContent>

                  <CardFooter className="pt-4">
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJobClick(job.slug);
                      }}
                    >
                      Se demo-jobb
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Info Box */}
          {!loading && jobs.length > 0 && (
            <div className="mt-12 max-w-3xl mx-auto">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-heading font-semibold text-lg mb-2">
                    💡 Om demo-jobb
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Detta är demonstrationsjobb som visar hur NoCV:s rekryteringsprocess fungerar. 
                    Du kan fritt testa att ansöka och utforska funktionerna - alla ansökningar är markerade som demo 
                    och kommer inte att behandlas som riktiga ansökningar.
                  </p>
                  <Button onClick={() => navigate('/jobs')} variant="default">
                    Se riktiga lediga jobb
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Demo;
