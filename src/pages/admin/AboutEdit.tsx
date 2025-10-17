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

// Helper function to clean empty content
const cleanEmptyContent = (html: string) => {
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  return stripped.length === 0 ? '' : html;
};

export default function AboutEdit() {
  const queryClient = useQueryClient();
  
  const [heroContent, setHeroContent] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [visionContent, setVisionContent] = useState('');
  const [valuesContent, setValuesContent] = useState('');

  // Fetch existing content
  const { data: sections, isLoading } = useQuery({
    queryKey: ['page-content', 'about'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_key', 'about')
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
  });

  // Set content when data loads
  useEffect(() => {
    if (sections) {
      const hero = sections.find(s => s.section_key === 'hero');
      const story = sections.find(s => s.section_key === 'story');
      const vision = sections.find(s => s.section_key === 'vision');
      const values = sections.find(s => s.section_key === 'values');
      
      if (hero) setHeroContent(hero.content_html);
      if (story) setStoryContent(story.content_html);
      if (vision) setVisionContent(vision.content_html);
      if (values) setValuesContent(values.content_html);
    }
  }, [sections]);

  // Mutation to save changes
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { section_key: 'hero', content_html: cleanEmptyContent(heroContent) },
        { section_key: 'story', content_html: cleanEmptyContent(storyContent) },
        { section_key: 'vision', content_html: cleanEmptyContent(visionContent) },
        { section_key: 'values', content_html: cleanEmptyContent(valuesContent) },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('page_content')
          .update({ content_html: update.content_html })
          .eq('page_key', 'about')
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
            <h1 className="text-3xl font-bold">Redigera Om oss-sidan</h1>
            <p className="text-muted-foreground mt-1">
              Använd editorn nedan för att uppdatera innehållet på Om oss-sidan
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
            <TabsTrigger value="story">Vår historia</TabsTrigger>
            <TabsTrigger value="vision">Vår vision</TabsTrigger>
            <TabsTrigger value="values">Våra värderingar</TabsTrigger>
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

              <TabsContent value="story" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Vår historia</CardTitle>
                    <CardDescription>
                      Berätta varför ni startade NOCV
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RichTextEditor
                      content={storyContent}
                      onChange={setStoryContent}
                      placeholder="Skriv er historia..."
                      minHeight="300px"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vision" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Vår vision</CardTitle>
                    <CardDescription>
                      Vad vill ni uppnå med NOCV?
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RichTextEditor
                      content={visionContent}
                      onChange={setVisionContent}
                      placeholder="Beskriv er vision..."
                      minHeight="300px"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="values" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Våra värderingar</CardTitle>
                    <CardDescription>
                      Vilka värderingar driver er?
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RichTextEditor
                      content={valuesContent}
                      onChange={setValuesContent}
                      placeholder="Lista era värderingar..."
                      minHeight="300px"
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

                  <TabsContent value="story" className="mt-0">
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(storyContent) 
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="vision" className="mt-0">
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(visionContent) 
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="values" className="mt-0">
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(valuesContent) 
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