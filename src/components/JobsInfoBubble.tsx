import { HelpCircle, Clock, FileX, Smartphone, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const steps = [
  { number: 1, title: "Välj roll och starta", desc: "Klicka på en tjänst och kör igång direkt." },
  { number: 2, title: "Svara på yrkesfrågor", desc: "Vanligt yrkessnack – inga kuggfrågor." },
  { number: 3, title: "Vi förstår din nivå", desc: "Junior, erfaren eller senior – vi matchar rätt." },
  { number: 4, title: "Matchning", desc: "Passar det hör vi av oss. Ingen spam." },
];

const JobsInfoBubble = () => {
  return (
    <TooltipProvider delayDuration={200}>
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/80 text-primary-foreground hover:scale-110 hover:shadow-lg transition-all duration-200 cursor-pointer"
                aria-label="Hur funkar det?"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-sm max-w-[220px]">
            Hur funkar det att söka jobb här? Klicka så berättar vi!
          </TooltipContent>
        </Tooltip>

        <PopoverContent
          side="bottom"
          align="end"
          className="w-[calc(100vw-2rem)] sm:w-80 p-5 bg-white border-border shadow-card"
        >
          <h3 className="font-heading font-bold text-lg text-foreground mb-3">
            Så enkelt är det
          </h3>

          <div className="space-y-3 mb-4">
            {steps.map((s) => (
              <div key={s.number} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                  {s.number}
                </span>
                <div>
                  <p className="font-semibold text-sm text-foreground leading-tight">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-4 border-t border-border pt-3">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 10 min</span>
            <span className="flex items-center gap-1"><FileX className="w-3.5 h-3.5" /> Inget CV</span>
            <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> Mobil</span>
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Tryggt</span>
          </div>

          <Button variant="cta-primary" size="sm" className="w-full" asChild>
            <Link to="/sa-funkar-det">Läs mer</Link>
          </Button>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};

export default JobsInfoBubble;
