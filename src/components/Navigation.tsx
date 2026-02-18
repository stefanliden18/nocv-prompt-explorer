import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { AdminStatusButton } from "./AdminStatusButton";
import { TipNOCVDialog } from "./TipNOCVDialog";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tipNoCVDialogOpen, setTipNoCVDialogOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { isPortalUser } = usePortalAuth();
  const navigate = useNavigate();

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
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
            <button 
              onClick={() => setTipNoCVDialogOpen(true)}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              💡 Tipsa om NoCV
            </button>
            {isPortalUser && (
              <Link to="/portal" className="text-foreground hover:text-primary transition-colors font-medium">
                Kundportal
              </Link>
            )}
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
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setTipNoCVDialogOpen(true);
                    }}
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors text-left"
                  >
                    💡 Tipsa om NoCV
                  </button>
                  {isPortalUser && (
                    <Link 
                      to="/portal" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Kundportal
                    </Link>
                  )}
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

    <TipNOCVDialog 
      open={tipNoCVDialogOpen} 
      onOpenChange={setTipNoCVDialogOpen}
    />
    </>
  );
};

export default Navigation;