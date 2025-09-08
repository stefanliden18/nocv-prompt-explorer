const Footer = () => {
  return (
    <footer className="bg-nocv-dark-blue text-white py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Logo and Description */}
            <div className="space-y-4">
              <div className="flex items-center">
                <h3 className="text-2xl font-bold font-heading text-white">
                  NOCV
                </h3>
              </div>
              <p className="text-white/80 text-lg leading-relaxed max-w-md">
                NOCV – Rekrytering för framtidens industri
              </p>
            </div>

            {/* Navigation Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold font-heading text-white mb-4">
                Navigation
              </h4>
              <nav className="grid grid-cols-2 gap-3">
                <a 
                  href="/" 
                  className="text-white/80 hover:text-nocv-orange transition-colors duration-200 font-medium"
                >
                  Hem
                </a>
                <a 
                  href="/jobs" 
                  className="text-white/80 hover:text-nocv-orange transition-colors duration-200 font-medium"
                >
                  Lediga jobb
                </a>
                <a 
                  href="/candidates" 
                  className="text-white/80 hover:text-nocv-orange transition-colors duration-200 font-medium"
                >
                  För kandidater
                </a>
                <a 
                  href="/companies" 
                  className="text-white/80 hover:text-nocv-orange transition-colors duration-200 font-medium"
                >
                  För företag
                </a>
                <a 
                  href="/contact" 
                  className="text-white/80 hover:text-nocv-orange transition-colors duration-200 font-medium"
                >
                  Kontakt
                </a>
              </nav>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-white/60 text-sm">
              © 2024 NOCV. Alla rättigheter förbehållna.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;