-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
);

-- RLS policies for company-logos bucket
-- Allow public to view logos
CREATE POLICY "Public can view company logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-logos');

-- Allow authenticated recruiters and admins to upload logos
CREATE POLICY "Recruiters and admins can upload company logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('recruiter', 'admin')
    )
  )
);

-- Allow authenticated recruiters and admins to update logos
CREATE POLICY "Recruiters and admins can update company logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'company-logos'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('recruiter', 'admin')
    )
  )
);

-- Allow authenticated recruiters and admins to delete logos
CREATE POLICY "Recruiters and admins can delete company logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'company-logos'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('recruiter', 'admin')
    )
  )
);