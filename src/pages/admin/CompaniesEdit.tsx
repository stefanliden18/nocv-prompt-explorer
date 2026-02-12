import { AdminLayout } from "@/components/AdminLayout";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { Save } from "lucide-react";

export default function CompaniesEdit() {
  const queryClient = useQueryClient();
  
  const [heroContent, setHeroContent] = useState('');
  const [benefitsIntroContent, setBenefitsIntroContent] = useState('');
  const [howItWorksContent, setHowItWorksContent] = useState('');
  const [ctaContent, setCtaContent] = useState('');

  // Fetch existing content
  const { data: sections, isLoading } = useQuery({
    queryKey: ['page-content', 'companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_key', 'companies')
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
  });

  // Set content when data loads
  useEffect(() => {
    if (sections) {
      const hero = sections.find(s => s.section_key === 'hero');
      const benefitsIntro = sections.find(s => s.section_key === 'benefits_intro');
      const howItWorks = sections.find(s => s.section_key === 'how_it_works');
      const cta = sections.find(s => s.section_key === 'cta');
      
      if (hero) setHeroContent(hero.content_html);
      if (benefitsIntro) setBenefitsIntroContent(benefitsIntro.content_html);
      if (howItWorks) setHowItWorksContent(howItWorks.content_html);
      if (cta) setCtaContent(cta.content_html);
    }
  }, [sections]);

  // Mutation to save changes
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { section_key: 'hero', content_html: heroContent },
        { section_key: 'benefits_intro', content_html: benefitsIntroContent },
        { section_key: 'how_it_works', content_html: howItWorksContent },
        { section_key: 'cta', content_html: ctaContent },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('page_content')
          .update({ content_html: update.content_html })
          .eq('page_key', 'companies')
          .eq('section_key', update.section_key);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-content'] });
      toast.success('Ändringar sparade!');
    },
    onError: () => {
      toast.error('Kunde inte spara ändringar');
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Redigera Företag-sidan</h1>
            <p className="text-muted-foreground mt-1">
              Använd editorn nedan för att uppdatera innehållet på Företag-sidan
            </p>
          </div>
          <Button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Sparar...' : 'Spara ändringar'}
          </Button>
        </div>

        <Tabs defaultValue="hero" className="space-y-4">
          <TabsList>
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="benefits_intro">Fördelar-intro</TabsTrigger>
            <TabsTrigger value="how_it_works">Så fungerar det</TabsTrigger>
            <TabsTrigger value="cta">Call to action</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column: Editor */}
            <div className="space-y-4">
              <TabsContent value="hero" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Hero-sektion</CardTitle>
                    <CardDescription>
                      Huvudbudskap som visas överst på sidan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RichTextEditor
                      content={heroContent}
                      onChange={setHeroContent}
                      placeholder="Skriv hero-text..."
                      minHeight="250px"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="benefits_intro" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Fördelar-introduktion</CardTitle>
                    <CardDescription>
                      Text som introducerar fördelarna för företag
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RichTextEditor
                      content={benefitsIntroContent}
                      onChange={setBenefitsIntroContent}
                      placeholder="Skriv introduktionstext..."
                      minHeight="250px"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="how_it_works" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Så fungerar det</CardTitle>
                    <CardDescription>
                      Förklara hur NoCV fungerar för företag
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RichTextEditor
                      content={howItWorksContent}
                      onChange={setHowItWorksContent}
                      placeholder="Beskriv hur det fungerar..."
                      minHeight="250px"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cta" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Call to action</CardTitle>
                    <CardDescription>
                      Text som uppmuntrar företag att kontakta er
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RichTextEditor
                      content={ctaContent}
                      onChange={setCtaContent}
                      placeholder="Skriv CTA-text..."
                      minHeight="250px"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            {/* Right column: Preview */}
            <div className="space-y-4">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Förhandsvisning</CardTitle>
                  <CardDescription>
                    Så kommer innehållet att se ut på sidan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TabsContent value="hero" className="mt-0">
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(heroContent) 
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="benefits_intro" className="mt-0">
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(benefitsIntroContent) 
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="how_it_works" className="mt-0">
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(howItWorksContent) 
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="cta" className="mt-0">
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(ctaContent) 
                      }}
                    />
                  </TabsContent>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
