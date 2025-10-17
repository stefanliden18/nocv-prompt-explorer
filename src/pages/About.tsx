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


  // Get hero section
  const heroSection = sections?.find(s => s.section_key === 'hero');

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
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background opacity-50"></div>
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
          ) : heroSection ? (
            <div 
              className="prose prose-lg max-w-none dark:prose-invert opacity-90"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(heroSection.content_html) 
              }}
            />
          ) : null}
        </div>
      </section>


      <Footer />
    </div>
  );
}