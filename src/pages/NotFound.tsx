import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Sidan hittades inte | NoCV</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navigation />
      <div className="flex min-h-screen items-center justify-center px-4 pt-20">
        <div className="text-center">
          <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
          <p className="mb-2 text-2xl font-semibold text-foreground">Sidan hittades inte</p>
          <p className="mb-8 text-muted-foreground">Tyvärr kunde vi inte hitta sidan du letar efter.</p>
          <Button asChild>
            <Link to="/">Tillbaka till startsidan</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
