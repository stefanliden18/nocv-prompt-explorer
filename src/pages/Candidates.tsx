import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileCheck, Clock, Target } from "lucide-react";
import Navigation from "@/components/Navigation";

const Candidates = () => {
  const benefits = [
    {
      icon: FileCheck,
      title: "Enkel ansökan",
      description: "Ingen CV att skriva eller bifoga. Svara på enkla frågor om din erfarenhet och dina kunskaper.",
      color: "text-primary"
    },
    {
      icon: Clock,
      title: "Snabb process",
      description: "Få svar snabbt och träffa rätt arbetsgivare direkt. Inga långa väntetider eller onödiga steg.",
      color: "text-secondary"
    },
    {
      icon: Target,
      title: "Rätt jobb",
      description: "Vår AI matchar dig med jobb där dina färdigheter verkligen behövs och uppskattas.",
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
              Din kompetens. Vårt fokus.
            </h1>
            
            <p className="text-xl md:text-2xl leading-relaxed opacity-90 animate-fade-in">
              Hos NOCV söker du jobb utan CV. Vi är intresserade av vad du kan göra, 
              inte vad du har studerat. Visa upp dina kunskaper och hitta arbete 
              där din erfarenhet verkligen räknas.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-6">
              Så här fungerar det
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Istället för att skicka in ett CV berättar du om din praktiska erfarenhet, 
              dina färdigheter och vad du vill arbeta med. Vi kopplar dig till arbetsgivare 
              som söker just dina kunskaper.
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

      {/* Success Stories Preview */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold font-heading text-foreground mb-4">
              Ett stort antal har redan hittat jobb
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Från bilmekaniker till svetsare - våra kandidater får jobb baserat på vad de kan, 
              inte vad de har på papperet.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-white p-6 rounded-lg border border-border">
                <div className="text-3xl font-bold text-primary mb-2">85%</div>
                <div className="text-sm text-muted-foreground">Får jobbintervju inom 1 vecka</div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-border">
                <div className="text-3xl font-bold text-secondary mb-2">3 dagar</div>
                <div className="text-sm text-muted-foreground">Genomsnittlig svarstid</div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-border">
                <div className="text-3xl font-bold text-primary mb-2">92%</div>
                <div className="text-sm text-muted-foreground">Nöjda med matchningen</div>
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
              Redo att visa vad du kan?
            </h3>
            <p className="text-lg text-muted-foreground mb-10">
              Börja din resa mot ett jobb där din kompetens och erfarenhet står i centrum.
            </p>
            
            <Button 
              variant="cta-primary" 
              size="xl"
              onClick={() => window.location.href = '/jobs'}
              className="hover-scale"
            >
              Se lediga jobb
            </Button>
            
            <p className="text-muted-foreground mt-6 max-w-2xl mx-auto">
              Efter din ansökan blir du automatiskt intervjuad via text eller röst — 
              utan CV, när det passar dig, via mobil eller dator.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Candidates;