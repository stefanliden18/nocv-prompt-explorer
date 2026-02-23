import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Clock, CheckCircle, Smartphone, Shield, MousePointerClick, MessageSquare, BarChart3, Handshake, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const steps = [
  {
    number: 1,
    icon: MousePointerClick,
    title: "Välj roll och starta",
    description: "Klicka på en tjänst och kör igång direkt från mobilen. Inget att ladda ner, inget konto att skapa.",
    time: "30 sek",
    color: "text-primary" as const,
  },
  {
    number: 2,
    icon: MessageSquare,
    title: "Svara på yrkesfrågor",
    description: "Vår AI ställer frågor om det du jobbar med varje dag — motor, plåt, lack, el. Inga kuggfrågor, bara vanligt yrkessnack.",
    time: "~10 min",
    color: "text-secondary" as const,
  },
  {
    number: 3,
    icon: BarChart3,
    title: "Vi förstår din nivå",
    description: "Inga rätt eller fel. Vi vill bara se om du är junior, erfaren eller senior — så vi kan matcha rätt.",
    time: "Automatiskt",
    color: "text-primary" as const,
  },
  {
    number: 4,
    icon: Handshake,
    title: "Matchning med arbetsgivare",
    description: "Finns ett jobb som passar dig hör vi av oss. Ingen spam, bara relevanta möjligheter.",
    time: "Vi hör av oss",
    color: "text-secondary" as const,
  },
];

const trustItems = [
  { icon: Clock, label: "10 minuter" },
  { icon: CheckCircle, label: "Inget CV krävs" },
  { icon: Smartphone, label: "Funkar på mobilen" },
  { icon: Shield, label: "Dina svar är trygga" },
];

const faqItems = [
  {
    question: "Behöver jag förbereda mig?",
    answer: "Nej! Frågorna handlar om det du redan kan. Tänk på det som att snacka med en ny kollega.",
  },
  {
    question: "Kan jag misslyckas?",
    answer: "Det finns inga rätt eller fel. Vi vill bara förstå din erfarenhetsnivå.",
  },
  {
    question: "Hur lång tid tar det?",
    answer: "Ungefär 10 minuter. Du kan göra det på bussen, i soffan eller på lunchen.",
  },
  {
    question: "Funkar det på mobilen?",
    answer: "Ja! Chatta eller prata — du väljer. Mobil, surfplatta eller dator.",
  },
  {
    question: "Vad händer efter intervjun?",
    answer: "Vi kontaktar dig om det finns ett jobb som matchar. Ingen spam.",
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Så funkar det – AI-intervju på 10 minuter | NoCV</title>
        <meta name="description" content="Sök jobb som att snacka med en kollega. Inget CV, inga personliga brev – svara på frågor om ditt yrke och bli matchad på 10 minuter." />
        <link rel="canonical" href="https://nocv.se/sa-funkar-det" />
        <meta property="og:title" content="Så funkar det – AI-intervju på 10 minuter | NoCV" />
        <meta property="og:description" content="Inget CV behövs. Svara på frågor om ditt yrke och bli matchad med rätt jobb på 10 minuter." />
        <meta property="og:url" content="https://nocv.se/sa-funkar-det" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://nocv.se/images/og-default.jpg" />
        <meta property="og:locale" content="sv_SE" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqItems.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": { "@type": "Answer", "text": item.answer }
          }))
        })}</script>
      </Helmet>

      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              <h2 className="text-2xl font-bold font-heading text-primary">NoCV</h2>
            </Link>
            <Button variant="cta-primary" asChild>
              <Link to="/jobs">Testa nu</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-hero text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6 leading-tight animate-fade-in">
              Sök jobb som att snacka med en kollega
            </h1>
            <p className="text-xl md:text-2xl leading-relaxed opacity-90 mb-10 animate-fade-in">
              Inget CV. Inget personligt brev. Du svarar på frågor om ditt yrke 
              via chatt eller röst — klart på 10 minuter. Så enkelt borde det alltid vara.
            </p>
            <Button variant="cta-primary" size="xl" asChild className="animate-fade-in">
              <Link to="/jobs">Testa nu – det är gratis</Link>
            </Button>
            <p className="text-white/60 mt-4 text-sm animate-fade-in">
              Ingen registrering. Tar 10 minuter.
            </p>
          </div>
        </div>
      </section>

      {/* Så funkar det — 4 steg */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-4">
              Så funkar det
            </h2>
            <p className="text-lg text-muted-foreground">
              Fyra enkla steg — från klick till jobbmatchning.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card
                  key={index}
                  className="bg-white border border-border hover:shadow-card hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-5">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold font-heading text-lg">
                          {step.number}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon size={24} className={step.color} strokeWidth={1.5} />
                          <h3 className="text-xl font-semibold font-heading text-foreground">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-muted-foreground leading-relaxed mb-3">
                          {step.description}
                        </p>
                        <span className="inline-block text-sm font-medium text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                          {step.time}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust-bar */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {trustItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-center justify-center gap-3 py-3">
                  <Icon size={24} className="text-primary flex-shrink-0" strokeWidth={1.5} />
                  <span className="font-medium text-foreground">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-6">
              Redo att testa?
            </h3>
            <Button variant="cta-primary" size="xl" asChild>
              <Link to="/jobs">Testa nu – det är gratis</Link>
            </Button>
            <p className="text-muted-foreground mt-6">
              Ingen registrering. Tar 10 minuter.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gradient-hero text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-10">
            {[
              {
                quote: "Jag trodde det skulle vara nåt krångligt test, men det var bara frågor om det jag gör varje dag. Tog 10 min på mobilen.",
                name: "Marcus",
                role: "Servicetekniker i Stockholm",
              },
              {
                quote: "Jag har jobbat med plåt och lack i några år men mitt CV ser inte så mycket ut. Här fick jag bara svara på frågor om det jag faktiskt kan – det kändes rättvist. Två dagar senare ringde de.",
                name: "Mohammed",
                role: "Skadetekniker i Stockholm",
              },
              {
                quote: "Jag var nervös för att det var en AI, men det var som att chatta med någon som fattar branschen. Frågorna handlade om saker jag gör varje dag. Enklaste jobbansökan jag gjort.",
                name: "Fatima",
                role: "Servicetekniker i Södertälje",
              },
            ].map((t) => (
              <div key={t.name} className="text-center">
                <Quote size={36} className="mx-auto mb-4 text-white/40" strokeWidth={1} />
                <blockquote className="text-base md:text-lg leading-relaxed text-white/90 mb-6 italic">
                  "{t.quote}"
                </blockquote>
                <p className="font-semibold text-nocv-orange text-lg">{t.name}</p>
                <p className="text-white/60">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-10 text-center">
              Vanliga frågor
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left text-lg font-heading">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Avslutande CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold font-heading text-foreground mb-6">
              Din kompetens förtjänar att synas
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Ditt nästa jobb väntar. Och det enda du behöver göra är att svara på några frågor.
            </p>
            <Button variant="cta-primary" size="xl" asChild>
              <Link to="/jobs">Se lediga jobb</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
