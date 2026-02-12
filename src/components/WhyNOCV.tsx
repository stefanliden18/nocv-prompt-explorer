import { UserCheck, Zap, Brain } from "lucide-react";

const WhyNoCV = () => {
  const features = [
    {
      icon: UserCheck,
      title: "Enklare för kandidater",
      description: "Visa vad du kan istället för vad du har på papperet. Inga CV-krav, bara dina färdigheter.",
      color: "text-primary"
    },
    {
      icon: Zap,
      title: "Snabbare för företag",
      description: "Hitta rätt kandidat på dagar istället för veckor. Effektiv process utan CV-genomgång.",
      color: "text-secondary"
    },
    {
      icon: Brain,
      title: "Rätt matchning med AI",
      description: "Vår AI matchar kompetens och behov, inte utbildningsbakgrund. Smartare rekrytering.",
      color: "text-primary"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-foreground mb-6">
            Varför NoCV?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Vi rekryterar utan CV och fokuserar istället på kunskap och erfarenhet. 
            Här är varför det fungerar bättre för alla.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="text-center group hover:shadow-card rounded-xl p-8 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="mb-6 flex justify-center">
                  <div className={`p-4 rounded-full bg-gradient-to-br ${
                    feature.color === 'text-primary' 
                      ? 'from-primary/10 to-primary/20' 
                      : 'from-secondary/10 to-secondary/20'
                  }`}>
                    <Icon 
                      size={48} 
                      className={`${feature.color} transition-transform group-hover:scale-110`}
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold font-heading text-foreground mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyNoCV;