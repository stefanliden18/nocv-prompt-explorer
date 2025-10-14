-- Drop trigger first, then recreate function with proper search_path
DROP TRIGGER IF EXISTS update_page_content_updated_at ON public.page_content;
DROP FUNCTION IF EXISTS public.update_page_content_updated_at();

CREATE OR REPLACE FUNCTION public.update_page_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql' 
SECURITY DEFINER
SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER update_page_content_updated_at 
  BEFORE UPDATE ON public.page_content 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_page_content_updated_at();