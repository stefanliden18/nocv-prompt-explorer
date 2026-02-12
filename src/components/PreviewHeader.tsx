import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Eye, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { AdminStatusButton } from "./AdminStatusButton";

interface PreviewHeaderProps {
  jobId: string;
}

export const PreviewHeader = ({ jobId }: PreviewHeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Main Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                <h2 className="text-2xl font-bold font-heading text-primary">
                  NoCV
                </h2>
              </Link>
            </div>

            {/* Navigation Links - Hidden on mobile, shown on desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/jobs" className="text-foreground hover:text-primary transition-colors font-medium">
                Lediga jobb
              </Link>
              <Link to="/candidates" className="text-foreground hover:text-primary transition-colors font-medium">
                För jobbsökare
              </Link>
              <Link to="/companies" className="text-foreground hover:text-primary transition-colors font-medium">
                För företag
              </Link>
              <Link to="/om-oss" className="text-foreground hover:text-primary transition-colors font-medium">
                Om oss
              </Link>
              <Link to="/contact" className="text-foreground hover:text-primary transition-colors font-medium">
                Kontakt
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-foreground hover:text-primary transition-colors font-medium">
                  Admin
                </Link>
              )}
            </div>

            {/* CTA Buttons and Mobile Menu */}
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex">
                <AdminStatusButton />
              </div>
              
              {/* Mobile Login Button - Always visible on mobile */}
              <div className="sm:hidden">
                <AdminStatusButton />
              </div>
              
              {/* Mobile Menu - Only shown on mobile and tablet */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Öppna meny</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <nav className="flex flex-col space-y-6 mt-6">
                    <Link 
                      to="/jobs" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Lediga jobb
                    </Link>
                    <Link 
                      to="/candidates" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      För jobbsökare
                    </Link>
                    <Link 
                      to="/companies" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      För företag
                    </Link>
                    <Link 
                      to="/om-oss" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Om oss
                    </Link>
                    <Link 
                      to="/contact" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Kontakt
                    </Link>
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <div className="pt-4 border-t border-border">
                      <AdminStatusButton />
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Preview Banner */}
      <div className="bg-warning text-warning-foreground border-b-4 border-warning-foreground/20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold text-sm md:text-lg">
              FÖRHANDSVISNING - Endast synlig för administratörer
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/jobs/${jobId}/edit`)}
            className="bg-background hidden sm:flex"
          >
            <X className="h-4 w-4 mr-2" />
            Stäng förhandsvisning
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/admin/jobs/${jobId}/edit`)}
            className="bg-background sm:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
