import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-automotive-workers.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Automotive workers - mechanics, technicians, and welders in car workshop"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold font-heading mb-4 leading-tight">
            Sök jobb utan CV
          </h1>
          
          <h2 className="text-xl md:text-2xl mb-8 font-body text-white/90 max-w-3xl mx-auto leading-relaxed opacity-90">
            Bli intervjuad automatiskt när det passar dig – via text eller röst på mobil eller dator
          </h2>
          
          <p className="text-xl md:text-2xl mb-12 font-body leading-relaxed max-w-3xl mx-auto opacity-90">
            Vi är intresserade av vad du kan och vad du vill, inte vad du har studerat!
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              variant="cta-primary" 
              size="xl"
              className="w-full sm:w-auto min-w-[200px]"
              onClick={() => window.location.href = '/jobs'}
            >
              Hitta personal
            </Button>
            
            <Button 
              variant="cta-secondary" 
              size="xl"
              className="w-full sm:w-auto min-w-[200px]"
              onClick={() => window.location.href = '/candidates'}
            >
              Sök jobb
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;