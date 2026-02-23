import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, UserPlus, Zap } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DOMPurify from "dompurify";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Companies = () => {
  const navigate = useNavigate();
  
  const { data: contentSections } = useQuery({
    queryKey: ['page-content', 'companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_key', 'companies')
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
  });

  const heroSection = contentSections?.find(s => s.section_key === 'hero');
  const benefitsIntroSection = contentSections?.find(s => s.section_key === 'benefits_intro');
  const howItWorksSection = contentSections?.find(s => s.section_key === 'how_it_works');
  const ctaSection = contentSections?.find(s => s.section_key === 'cta');

  const benefits = [
    {
      icon: Eye,
      title: "Ni ser kompetens, inte CV",
      description: "Våra AI-intervjuer testar kandidaterna på riktiga yrkesfrågor. Ni får en bedömning av deras faktiska kunskapsnivå – inte hur bra de är på att skriva om sig själva.",
      color: "text-primary"
    },
    {
      icon: UserPlus,
      title: "Kandidater ni annars aldrig hittar",
      description: "Många av de bästa teknikerna söker aldrig jobb med CV. De byter jobb genom kontakter. Med NoCV når ni dem – en snabb intervju på mobilen är enklare än att uppdatera ett CV.",
      color: "text-secondary"
    },
    {
      icon: Zap,
      title: "Från annons till kandidat på dagar, inte veckor",
      description: "Vår AI intervjuar dygnet runt. Kandidaten svarar när det passar dem – kväll, helg, lunch. Ni får färdigbedömda kandidater utan att lägga tid på första gallringen.",
      color: "text-primary"
    }
  ];

  const steps = [
    { num: "1", title: "Berätta vad ni söker", desc: "Vilken roll, vilken nivå, vilka kunskaper? Vi sätter upp intervjufrågor anpassade efter er tjänst – på 24 timmar.", color: "text-primary" },
    { num: "2", title: "Vi hittar och intervjuar", desc: "Vår AI publicerar tjänsten och intervjuar kandidater automatiskt via chatt eller röst. Dygnet runt, utan att ni behöver göra något.", color: "text-secondary" },
    { num: "3", title: "Ni får bedömda kandidater", desc: "Vi levererar kandidater med en tydlig bedömning av deras kunskapsnivå. Ni ser direkt vem som är junior, erfaren eller senior.", color: "text-primary" },
    { num: "4", title: "Ni väljer och träffar", desc: "Ni bestämmer vilka ni vill träffa. Vi bokar in mötet. Enkelt.", color: "text-secondary" },
  ];

  const stats = [
    { value: "3–4 dgr", label: "Genomsnittlig tid till första kandidatpresentation" },
    { value: "93 %", label: "Av företag som testat NoCV rekryterar igen med oss" },
    { value: "Dygnet runt", label: "Vår AI intervjuar medan ni fokuserar på verkstaden" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>För företag – Hitta rätt kandidat utan CV-genomgång | NoCV</title>
        <meta name="description" content="Sluta leta i CV-högar. Vår AI intervjuar kandidater åt er dygnet runt och levererar färdigbedömda kandidater inom dagar." />
        <link rel="canonical" href="https://nocv.se/companies" />
        <meta property="og:title" content="För företag – Hitta rätt kandidat utan CV-genomgång | NoCV" />
        <meta property="og:description" content="Vår AI intervjuar mekaniker och tekniker åt er dygnet runt. Ni får färdigbedömda kandidater inom dagar." />
        <meta property="og:url" content="https://nocv.se/companies" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://nocv.se/images/og-default.jpg" />
        <meta property="og:locale" content="sv_SE" />
      </Helmet>
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-hero text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {heroSection ? (
              <div 
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-white prose-p:text-white prose-p:opacity-90 animate-fade-in"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(heroSection.content_html) }}
              />
            ) : (
              <>
                <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6 leading-tight animate-fade-in">
                  Sluta leta i CV-högar. Träffa rätt kandidat direkt.
                </h1>
                <p className="text-xl md:text-2xl leading-relaxed opacity-90 animate-fade-in mb-8">
                  Vi intervjuar mekaniker, skadetekniker och fordonstekniker åt er med AI – innan ni ens behöver lyfta luren. Ni får kandidater som redan visat att de kan jobbet.
                </p>
                <Button 
                  variant="cta-primary" 
                  size="xl"
                  className="hover-scale"
                  onClick={() => navigate('/contact')}
                >
                  Boka en demo
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            {benefitsIntroSection ? (
              <div 
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(benefitsIntroSection.content_html) }}
              />
            ) : (
              <>
                <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-6">
                  Varför verkstäder väljer NoCV
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Traditionell rekrytering tar veckor och ger en hög med CV:n som inte säger ett dugg om hur bra någon är på att felsöka en motor. Vi gör det annorlunda.
                </p>
              </>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card 
                  key={index}
                  className="bg-white border border-border hover:shadow-card transition-all duration-300 hover:transform hover:scale-105 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-8 text-center">
                    <div className="mb-6 flex justify-center">
                      <div className={`p-4 rounded-full bg-gradient-to-br ${
                        benefit.color === 'text-primary' 
                          ? 'from-primary/10 to-primary/20' 
                          : 'from-secondary/10 to-secondary/20'
                      }`}>
                        <Icon size={48} className={`${benefit.color} transition-transform hover:scale-110`} strokeWidth={1.5} />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold font-heading text-foreground mb-4">{benefit.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {howItWorksSection ? (
              <div 
                className="prose prose-lg max-w-none dark:prose-invert mb-8"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(howItWorksSection.content_html) }}
              />
            ) : (
              <>
                <h3 className="text-2xl md:text-3xl font-bold font-heading text-foreground mb-4">
                  Så enkelt är det
                </h3>
                <p className="text-lg text-muted-foreground mb-8">
                  Fyra steg från att ni behöver personal till att ni träffar rätt person.
                </p>
              </>
            )}
            
            <div className="grid md:grid-cols-4 gap-6 text-center">
              {steps.map((step) => (
                <div key={step.num} className="bg-white p-6 rounded-lg border border-border">
                  <div className={`text-3xl font-bold ${step.color} mb-2`}>{step.num}</div>
                  <div className="text-sm font-semibold text-foreground mb-2">{step.title}</div>
                  <div className="text-sm text-muted-foreground">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social proof / stats */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-6">
          <h3 className="text-2xl md:text-3xl font-bold font-heading text-center mb-12">
            Det här har vi levererat
          </h3>
          <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto text-center">
            {stats.map((stat) => (
              <div key={stat.value}>
                <div className="text-4xl md:text-5xl font-bold font-heading mb-3">{stat.value}</div>
                <p className="text-lg opacity-90">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            {ctaSection ? (
              <div 
                className="prose prose-lg max-w-none dark:prose-invert mb-10"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ctaSection.content_html) }}
              />
            ) : (
              <>
                <h3 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-6">
                  Testa med er nästa rekrytering
                </h3>
                <p className="text-lg text-muted-foreground mb-10">
                  Boka en demo så visar vi hur det fungerar – 15 minuter, inga förpliktelser. Har ni ett akut behov kan vi ha kandidater redo inom en vecka.
                </p>
              </>
            )}
            
            <Button 
              variant="cta-primary" 
              size="xl"
              className="hover-scale"
              onClick={() => navigate('/contact')}
            >
              Boka demo – 15 min
            </Button>
            <p className="mt-6 text-muted-foreground">
              Eller ring oss direkt: <a href="tel:+46812345678" className="text-primary font-semibold hover:underline">08-123 45 67</a>
            </p>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Companies;
