-- Create table for page content
CREATE TABLE public.page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  section_key text NOT NULL,
  title text NOT NULL,
  content_html text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(page_key, section_key)
);

-- Index for faster queries
CREATE INDEX idx_page_content_page_key ON public.page_content(page_key);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_page_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_page_content_updated_at 
  BEFORE UPDATE ON public.page_content 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_page_content_updated_at();

-- Enable RLS
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view page content
CREATE POLICY "Anyone can view page content"
  ON public.page_content FOR SELECT
  USING (true);

-- Admins can update page content
CREATE POLICY "Admins can update page content"
  ON public.page_content FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert page content
CREATE POLICY "Admins can insert page content"
  ON public.page_content FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete page content
CREATE POLICY "Admins can delete page content"
  ON public.page_content FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Initial data for "About Us" page
INSERT INTO public.page_content (page_key, section_key, title, content_html, display_order) VALUES 
('about', 'hero', 'Om NOCV', '<h2>Välkommen till NOCV</h2><p>Vi revolutionerar rekrytering genom att fokusera på vad kandidater <strong>kan</strong> och vad de <strong>vill</strong> – inte vad de har studerat.</p>', 1),

('about', 'story', 'Vår historia', '<h3>Varför vi startade NOCV</h3><p><em>Här kan du berätta om er resa och varför ni startade företaget.</em></p><ul><li>Vilka problem såg ni på arbetsmarknaden?</li><li>Vad inspirerade er att skapa NOCV?</li><li>Vilken förändring vill ni se?</li></ul><p>Exempel: Vi såg hur många kompetenta personer missades i rekryteringsprocesser bara för att de saknade rätt papper. Vi ville skapa en plattform där färdigheter och potential värderas högre än examensbevis.</p>', 2),

('about', 'vision', 'Vår vision', '<h3>Vad vi vill uppnå</h3><p><em>Beskriv er vision för framtiden.</em></p><p>Vi strävar efter en arbetsmarknad där:</p><ul><li>🎯 Alla bedöms på sina faktiska färdigheter</li><li>🤖 AI används för att skapa mer rättvisa möjligheter</li><li>💡 Potential värderas högre än formella meriter</li><li>🚀 Kompetens är viktigare än examensbevis</li></ul>', 3),

('about', 'values', 'Våra värderingar', '<h3>Vad som driver oss</h3><p>Våra kärnvärderingar som guidar allt vi gör:</p><ul><li><strong>🤝 Inkludering</strong> - Alla ska få en rättvis chans att visa vad de kan</li><li><strong>💡 Innovation</strong> - Vi utmanar traditionella rekryteringsmetoder</li><li><strong>🔍 Transparens</strong> - Öppenhet i hela rekryteringsprocessen</li><li><strong>⚡ Effektivitet</strong> - Snabbare matchning, nöjdare kandidater och företag</li></ul>', 4);