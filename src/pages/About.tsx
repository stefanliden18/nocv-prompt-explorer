import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { Edit } from "lucide-react";
import { Helmet } from "react-helmet-async";
import heroImage from "@/assets/about-hero-industrial-team.jpg";

export default function About() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Fetch all sections for the About page
  const { data: sections, isLoading } = useQuery({
    queryKey: ['page-content', 'about'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_key', 'about')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Helper function to check if content is empty
  const isContentEmpty = (html: string) => {
    const stripped = html.replace(/<[^>]*>/g, '').trim();
    return stripped.length === 0;
  };

  // Hero section
  const heroSection = sections?.find(s => s.section_key === 'hero');
  const contentSections = sections?.filter(s => 
    s.section_key !== 'hero' && !isContentEmpty(s.content_html)
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Om NOCV - Vår historia, vision och värderingar</title>
        <meta 
          name="description" 
          content="Lär känna NOCV - vi revolutionerar rekrytering genom att fokusera på vad kandidater kan och vill, inte vad de har studerat. Läs om vår vision och värderingar." 
        />
      </Helmet>

      <Navigation />
      
      {/* Hero section with image */}
      <section 
        className="relative pt-32 pb-16 px-6 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background"></div>
        <div className="relative container mx-auto max-w-4xl z-10">
          {isAdmin && (
            <Button
              onClick={() => navigate('/admin/about/edit')}
              variant="outline"
              size="sm"
              className="mb-4"
            >
              <Edit className="h-4 w-4 mr-2" />
              Redigera sida
            </Button>
          )}
          
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          ) : (heroSection && !isContentEmpty(heroSection.content_html)) ? (
            <div 
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(heroSection.content_html) 
              }}
            />
          ) : null}
        </div>
      </section>

      {/* Content sections */}
      <section className="py-16 px-6 bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="container mx-auto max-w-4xl space-y-8">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="h-4 bg-muted rounded w-4/5"></div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            contentSections?.map((section) => (
              <div 
                key={section.id}
              >
                <div 
                  className="prose prose-lg max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(section.content_html) 
                  }}
                />
              </div>
            ))
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}