import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { Edit, Heart, Award, Smartphone } from "lucide-react";
import { Helmet } from "react-helmet-async";
import workshopImage from "@/assets/about-hero-industrial-team.jpg";

const fallback = {
  hero: '<h1>Vi tror inte på CV:n. Vi tror på människor.</h1>',
  body_1: '<p>NoCV startade med en enkel insikt: de bästa kandidaterna inom fordon och industri har sällan de bästa CV:na. Många har lärt sig yrket genom att göra – inte genom att studera. Ändå sorteras de bort redan i första steget av en traditionell rekryteringsprocess.</p>',
  pull_quote: '<p>Du kan vara den bästa mekanikern i branschen men ha världens tråkigaste CV.</p>',
  body_2: '<p>Därför byggde vi en rekryteringsprocess som börjar med en intervju istället för ett dokument. Vår AI ställer relevanta frågor om kompetens, erfarenhet och motivation – och ger varje kandidat chansen att visa vad de kan, oavsett bakgrund.</p>',
  body_3: '<p>Resultatet? Företag får träffa kandidater som verkligen matchar rollen – och kandidater slipper bli bedömda utifrån ett papper som aldrig kunde visa deras fulla potential.</p>',
};

const stats = [
  { value: "30+ år", label: "Erfarenhet från rekryteringsbranschen" },
  { value: "100 %", label: "Alla kandidater får en intervju" },
  { value: "0 dokument", label: "Krävs för att söka jobb hos oss" },
];

const values = [
  { icon: Heart, title: "Alla får en chans", description: "Varje kandidat intervjuas, oavsett bakgrund." },
  { icon: Award, title: "Kompetens före papper", description: "Vi mäter kunskap, inte formatering." },
  { icon: Smartphone, title: "Snabbt och enkelt", description: "10 minuter på mobilen, klart." },
];

export default function About() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: sections, isLoading } = useQuery({
    queryKey: ['page-content', 'about'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_key', 'about')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const getSection = (key: string) => {
    const section = sections?.find(s => s.section_key === key);
    return section?.content_html || fallback[key as keyof typeof fallback] || '';
  };

  // Strip HTML tags for pull-quote plain text
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Om NoCV – Vår historia och värderingar</title>
        <meta name="description" content="Lär känna NoCV – vi revolutionerar rekrytering genom att fokusera på vad kandidater kan, inte vad de har studerat." />
        <link rel="canonical" href="https://nocv.se/om-oss" />
        <meta property="og:title" content="Om NoCV – Vår historia och värderingar" />
        <meta property="og:description" content="Vi tror inte på CV:n. Vi tror på människor. Läs om hur NoCV förändrar rekrytering." />
        <meta property="og:url" content="https://nocv.se/om-oss" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://nocv.se/images/og-default.jpg" />
        <meta property="og:locale" content="sv_SE" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://nocv.se/" },
            { "@type": "ListItem", "position": 2, "name": "Om oss", "item": "https://nocv.se/om-oss" }
          ]
        })}</script>
      </Helmet>

      <Navigation />

      {/* Admin edit button */}
      {isAdmin && (
        <div className="container mx-auto px-6 pt-24 pb-0">
          <Button
            onClick={() => navigate('/admin/about/edit')}
            variant="outline"
            size="sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Redigera sida
          </Button>
        </div>
      )}

      {/* Hero */}
      <section className="bg-gradient-hero pt-32 pb-14 px-6">
      <div className="container mx-auto max-w-[800px] text-center">
          {isLoading ? (
            <div className="animate-pulse h-12 bg-white/10 rounded w-3/4 mx-auto" />
          ) : (
            <div
              className="prose prose-lg prose-invert max-w-none [&>h1]:text-4xl [&>h1]:md:text-5xl [&>h1]:font-bold [&>h1]:font-heading [&>h1]:text-white [&>h1]:leading-tight [&>p]:text-white/80 [&>p]:text-lg"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getSection('hero')) }}
            />
          )}
        </div>
      </section>

      {/* Body 1 */}
      <section className="pt-10 pb-4 px-6 bg-background">
        <div className="container mx-auto max-w-[800px]">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          ) : (
            <div
              className="prose prose-lg max-w-none dark:prose-invert text-left [&>p]:mb-6"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getSection('body_1')) }}
            />
          )}
        </div>
      </section>

      {/* Pull-quote */}
      <section className="py-6 px-6 bg-background">
        <div className="container mx-auto max-w-[800px] text-center">
          <blockquote className="text-2xl md:text-3xl font-bold font-heading text-nocv-orange italic leading-snug">
            "{stripHtml(getSection('pull_quote'))}"
          </blockquote>
        </div>
      </section>

      {/* Body 2 */}
      <section className="pt-4 pb-6 px-6 bg-background">
        <div className="container mx-auto max-w-[800px]">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-4/6" />
            </div>
          ) : (
            <div
              className="prose prose-lg max-w-none dark:prose-invert text-left [&>p]:mb-6"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getSection('body_2')) }}
            />
          )}
        </div>
      </section>

      {/* Image */}
      <section className="px-6 py-6 bg-background">
        <div className="container mx-auto max-w-4xl">
          <img
            src={workshopImage}
            alt="Teamet i en verkstadsmiljö"
            className="w-full rounded-2xl shadow-lg object-cover max-h-[420px]"
            loading="lazy"
          />
        </div>
      </section>

      {/* Body 3 */}
      <section className="pt-4 pb-10 px-6 bg-background">
        <div className="container mx-auto max-w-[800px]">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/6" />
            </div>
          ) : (
            <div
              className="prose prose-lg max-w-none dark:prose-invert text-left [&>p]:mb-6"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getSection('body_3')) }}
            />
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-gradient-hero text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold font-heading mb-8">Det här har vi levererat</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {stats.map((stat) => (
              <div key={stat.value}>
                <div className="text-4xl md:text-5xl font-bold font-heading mb-3">{stat.value}</div>
                <p className="text-lg opacity-90">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-14 px-6 bg-background">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold font-heading text-center mb-8">Våra värderingar</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((v) => (
              <div key={v.title} className="text-center p-6 rounded-2xl bg-muted/50">
                <div className="w-14 h-14 bg-nocv-orange/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <v.icon className="h-7 w-7 text-nocv-orange" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
                <p className="text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-6 bg-muted/30">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold font-heading mb-4">Nyfiken?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Oavsett om du söker jobb eller personal – vi visar gärna hur NoCV fungerar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="cta-primary text-lg px-8 py-6">
              <Link to="/jobs">Sök jobb</Link>
            </Button>
            <Button asChild variant="outline" className="text-lg px-8 py-6">
              <Link to="/companies">Hitta personal</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
