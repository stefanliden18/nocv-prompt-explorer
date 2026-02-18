import { Clock, FileX, Smartphone, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  { number: 1, title: "Välj roll och starta", desc: "Klicka på en tjänst och kör igång direkt." },
  { number: 2, title: "Svara på yrkesfrågor", desc: "Vanligt yrkessnack – inga kuggfrågor." },
  { number: 3, title: "Vi förstår din nivå", desc: "Junior, erfaren eller senior – vi matchar rätt." },
  { number: 4, title: "Matchning", desc: "Passar det hör vi av oss. Ingen spam." },
];

const trustBadges = [
  { icon: Clock, label: "10 min" },
  { icon: FileX, label: "Inget CV" },
  { icon: Smartphone, label: "Mobil" },
  { icon: Shield, label: "Tryggt" },
];

const JobsHowItWorks = () => {
  return (
    <Card className="bg-white border border-border mt-6">
      <CardContent className="p-6">
        <h3 className="font-heading font-bold text-lg text-foreground mb-4">
          Så här enkelt söker du
        </h3>

        <div className="space-y-3 mb-5">
          {steps.map((s) => (
            <div key={s.number} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                {s.number}
              </span>
              <div>
                <p className="font-semibold text-sm text-foreground leading-tight">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-5 border-t border-border pt-3">
          {trustBadges.map((b) => (
            <span key={b.label} className="flex items-center gap-1">
              <b.icon className="w-3.5 h-3.5" /> {b.label}
            </span>
          ))}
        </div>

        <Button variant="cta-primary" size="sm" className="w-full" asChild>
          <Link to="/sa-funkar-det">Läs mer om hur det funkar</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default JobsHowItWorks;
