import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Companies = () => {
  const benefits = [
    {
      icon: Users,
      title: "Effektivare urval",
      description: "Hitta kandidater baserat på faktiska kunskaper och erfarenhet istället för hur bra de är på att skriva CV.",
      color: "text-primary"
    },
    {
      icon: Target,
      title: "Fler relevanta kandidater",
      description: "Vårt system matchar kompetens med behov, vilket ger dig tillgång till fler kvalificerade kandidater.",
      color: "text-secondary"
    },
    {
      icon: Clock,
      title: "Kortare rekryteringstid",
      description: "Automatiserade intervjuer och smart matchning minskar tiden från annons till anställning avsevärt.",
      color: "text-primary"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-hero text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6 leading-tight animate-fade-in">
              Snabbare rekrytering utan CV
            </h1>
            
            <p className="text-xl md:text-2xl leading-relaxed opacity-90 animate-fade-in">
              NOCV hjälper ditt företag hitta rätt kandidater baserat på kunskaper och kompetens 
              istället för traditionella CV. Fokusera på vad kandidaterna kan göra, 
              inte vad de har studerat eller tidigare roller.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-6">
              Fördelar för ditt företag
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Med NOCV får du en modernare och mer effektiv rekryteringsprocess som 
              fokuserar på kandidaternas faktiska förmågor och potential.
            </p>
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
                        <Icon 
                          size={48} 
                          className={`${benefit.color} transition-transform hover:scale-110`}
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold font-heading text-foreground mb-4">
                      {benefit.title}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works for companies */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold font-heading text-foreground mb-4">
              Så fungerar NOCV för företag
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Publicera dina lediga tjänster och låt vårt system automatiskt matcha och 
              intervjua kandidater baserat på de kunskaper och erfarenheter du söker.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-white p-6 rounded-lg border border-border">
                <div className="text-3xl font-bold text-primary mb-2">1</div>
                <div className="text-sm font-semibold text-foreground mb-2">Vi publicerar tjänsten</div>
                <div className="text-sm text-muted-foreground">Beskriv vilka kunskaper och erfarenheter ni söker</div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-border">
                <div className="text-3xl font-bold text-secondary mb-2">2</div>
                <div className="text-sm font-semibold text-foreground mb-2">Automatisk matchning</div>
                <div className="text-sm text-muted-foreground">Vårt system hittar och intervjuar relevanta kandidater</div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-border">
                <div className="text-3xl font-bold text-primary mb-2">3</div>
                <div className="text-sm font-semibold text-foreground mb-2">Träffa kandidater</div>
                <div className="text-sm text-muted-foreground">Få presentationer av kvalificerade kandidater direkt</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-6">
              Redo att förändra er rekrytering?
            </h3>
            <p className="text-lg text-muted-foreground mb-10">
              Upptäck hur NOCV kan hjälpa ert företag hitta rätt kandidater snabbare 
              och mer effektivt än traditionella metoder.
            </p>
            
            <Button 
              variant="cta-primary" 
              size="xl"
              className="hover-scale"
            >
              Kontakta oss för demo
            </Button>
            
            <p className="text-muted-foreground mt-6 max-w-2xl mx-auto">
              Vi visar gärna hur NOCV fungerar och hur det kan passa ert företags 
              rekryteringsbehov.
            </p>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Companies;