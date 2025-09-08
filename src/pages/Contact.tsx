import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic would go here
    console.log("Form submitted");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-hero text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6 leading-tight animate-fade-in">
              Kontakta oss
            </h1>
            
            <p className="text-xl md:text-2xl leading-relaxed opacity-90 animate-fade-in">
              Har du frågor? Vi hjälper gärna till.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white border border-border shadow-card">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground font-medium">
                        Namn *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        required
                        className="w-full"
                        placeholder="Ditt namn"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground font-medium">
                        E-post *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        className="w-full"
                        placeholder="din@epost.se"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-foreground font-medium">
                      Företag
                    </Label>
                    <Input
                      id="company"
                      type="text"
                      className="w-full"
                      placeholder="Ditt företag (valfritt)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-foreground font-medium">
                      Meddelande *
                    </Label>
                    <Textarea
                      id="message"
                      required
                      className="w-full min-h-[120px] resize-none"
                      placeholder="Berätta vad vi kan hjälpa dig med..."
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      type="submit"
                      variant="cta-primary" 
                      size="lg"
                      className="w-full hover-scale"
                    >
                      Skicka
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Contact Info */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold font-heading text-foreground mb-6">
              Andra sätt att nå oss
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div className="bg-white p-6 rounded-lg border border-border">
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  För jobbsökare
                </h4>
                <p className="text-muted-foreground">
                  Har du frågor om att söka jobb utan CV? Vi hjälper dig gärna att komma igång.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-border">
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  För företag
                </h4>
                <p className="text-muted-foreground">
                  Vill du veta mer om hur NOCV kan förbättra er rekryteringsprocess? Kontakta oss för en demo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Contact;