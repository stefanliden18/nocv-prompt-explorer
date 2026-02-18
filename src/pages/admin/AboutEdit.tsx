import { AdminLayout } from "@/components/AdminLayout";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { Save } from "lucide-react";

const cleanEmptyContent = (html: string) => {
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  return stripped.length === 0 ? '' : html;
};

const sectionConfig = [
  { key: 'hero', label: 'Hero-rubrik', description: 'Huvudrubrik som visas i hero-sektionen', type: 'rich' as const },
  { key: 'body_1', label: 'Stycke 1', description: 'Första textstycket', type: 'rich' as const },
  { key: 'pull_quote', label: 'Pull-quote (citat)', description: 'Citatet som visas i orange text', type: 'plain' as const },
  { key: 'body_2', label: 'Stycke 2', description: 'Andra textstycket', type: 'rich' as const },
  { key: 'body_3', label: 'Stycke 3', description: 'Tredje textstycket (efter bilden)', type: 'rich' as const },
];

export default function AboutEdit() {
  const queryClient = useQueryClient();
  const [contents, setContents] = useState<Record<string, string>>({});

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

  useEffect(() => {
    if (sections) {
      const map: Record<string, string> = {};
      sections.forEach(s => { map[s.section_key] = s.content_html; });
      setContents(map);
    }
  }, [sections]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = sectionConfig.map(sc => 
        supabase
          .from('page_content')
          .update({ content_html: cleanEmptyContent(contents[sc.key] || '') })
          .eq('page_key', 'about')
          .eq('section_key', sc.key)
      );
      const results = await Promise.all(updates);
      const err = results.find(r => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-content'] });
      toast.success('Ändringar sparade!');
    },
    onError: () => {
      toast.error('Kunde inte spara ändringar');
    },
  });

  const updateContent = (key: string, value: string) => {
    setContents(prev => ({ ...prev, [key]: value }));
  };

  // Strip HTML for plain-text pull-quote display
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
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
              Redigera varje sektion separat. Siffror, värderingar och CTA är statiska.
            </p>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Sparar...' : 'Spara alla ändringar'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editors */}
          <div className="space-y-6">
            {sectionConfig.map(sc => (
              <Card key={sc.key}>
                <CardHeader>
                  <CardTitle className="text-lg">{sc.label}</CardTitle>
                  <CardDescription>{sc.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {sc.type === 'plain' ? (
                    <Textarea
                      value={stripHtml(contents[sc.key] || '')}
                      onChange={e => updateContent(sc.key, `<p>${e.target.value}</p>`)}
                      placeholder="Skriv citatet här..."
                      rows={3}
                    />
                  ) : (
                    <RichTextEditor
                      content={contents[sc.key] || ''}
                      onChange={val => updateContent(sc.key, val)}
                      placeholder="Skriv här..."
                      minHeight="150px"
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Preview */}
          <Card className="sticky top-6 self-start">
            <CardHeader>
              <CardTitle>Förhandsvisning</CardTitle>
              <CardDescription>Så kommer textsektionerna att se ut</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Hero preview */}
              <div className="bg-gradient-hero rounded-lg p-6 text-center">
                <div
                  className="prose prose-invert max-w-none [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-white [&>p]:text-white/80"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contents.hero || '') }}
                />
              </div>

              {/* Body 1 */}
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contents.body_1 || '') }}
              />

              {/* Pull-quote */}
              <blockquote className="text-xl font-bold text-nocv-orange italic text-center py-4">
                "{stripHtml(contents.pull_quote || '')}"
              </blockquote>

              {/* Body 2 */}
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contents.body_2 || '') }}
              />

              {/* Body 3 */}
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contents.body_3 || '') }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
