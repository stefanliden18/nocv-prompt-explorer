-- Insert spontanansökan GetKiku URL in page_content table
INSERT INTO public.page_content (page_key, section_key, title, content_html, display_order)
VALUES (
  'jobs',
  'spontanansökan_url',
  'GetKiku Spontanansökan URL',
  '',
  0
)
ON CONFLICT (page_key, section_key) DO NOTHING;