import { AdminLayout } from "@/components/AdminLayout";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
      if (hero) setHeroContent(hero.content_html);
    }
  }, [sections]);

  // Mutation to save changes
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('page_content')
        .update({ content_html: cleanEmptyContent(heroContent) })
        .eq('page_key', 'about')
        .eq('section_key', 'hero');
      
      if (error) throw error;
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Om oss - Innehåll</CardTitle>
              <CardDescription>
                Redigera innehållet som visas på Om oss-sidan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={heroContent}
                onChange={setHeroContent}
                placeholder="Skriv om NOCV..."
                minHeight="400px"
              />
            </CardContent>
          </Card>

          {/* Right column: Preview */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Förhandsvisning</CardTitle>
              <CardDescription>
                Så kommer innehållet att se ut på sidan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(heroContent) 
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}