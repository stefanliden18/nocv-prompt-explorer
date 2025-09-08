import { Button } from "@/components/ui/button";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <h2 className="text-2xl font-bold font-heading text-primary">
              NOCV
            </h2>
          </div>

          {/* Navigation Links - Hidden on mobile, shown on desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/jobs" className="text-foreground hover:text-primary transition-colors font-medium">
              Lediga jobb
            </a>
            <a href="/candidates" className="text-foreground hover:text-primary transition-colors font-medium">
              För jobbsökare
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">
              För företag
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">
              Om oss
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="hidden sm:inline-flex">
              Logga in
            </Button>
            <Button variant="secondary" size="sm">
              Kom igång
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;