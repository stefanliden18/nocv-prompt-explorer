import { useState } from "react";
import { Link } from "react-router-dom";
import { TipNOCVDialog } from "./TipNOCVDialog";

const Footer = () => {
  const [tipNoCVDialogOpen, setTipNoCVDialogOpen] = useState(false);

  return (
    <>
    <footer className="bg-nocv-dark-blue text-white py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Logo and Description */}
            <div className="space-y-4">
              <div className="flex items-center">
                <h3 className="text-2xl font-bold font-heading text-white">
                  NoCV
                </h3>
              </div>
              <p className="text-white/80 text-lg leading-relaxed max-w-md">
                NoCV – Rekrytering för framtidens industri
              </p>
            </div>

            {/* Navigation Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold font-heading text-white mb-4">
                Navigation
              </h4>
              <nav className="grid grid-cols-2 gap-3">
                <Link 
                  to="/" 
                  className="text-white/80 hover:text-nocv-orange transition-colors duration-200 font-medium"
                >
                  Hem
                </Link>
                <Link 
                  to="/jobs" 
                  className="text-white/80 hover:text-nocv-orange transition-colors duration-200 font-medium"
                >
                  Lediga jobb
                </Link>
                <Link 
                  to="/candidates" 
                  className="text-white/80 hover:text-nocv-orange transition-colors duration-200 font-medium"
                >
                  För kandidater
                </Link>
                <Link 
                  to="/companies" 
                  className="text-white/80 hover:text-nocv-orange transition-colors duration-200 font-medium"
                >
                  För företag
                </Link>
                <Link 
                  to="/blogg" 
                  className="text-white/80 hover:text-nocv-orange transition-colors duration-200 font-medium"
                >
                  Blogg
                </Link>
                <Link 
                  to="/contact" 
                  className="text-white/80 hover:text-nocv-orange transition-colors duration-200 font-medium"
                >
                  Kontakt
                </Link>
                <button
                  onClick={() => setTipNoCVDialogOpen(true)}
                  className="text-white/80 hover:text-nocv-orange transition-colors duration-200 font-medium text-left"
                >
                  💡 Tipsa om NoCV
                </button>
              </nav>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} NoCV. Alla rättigheter förbehållna.
            </p>
          </div>
        </div>
      </div>
    </footer>

    <TipNOCVDialog 
      open={tipNoCVDialogOpen} 
      onOpenChange={setTipNoCVDialogOpen}
    />
    </>
  );
};

export default Footer;
