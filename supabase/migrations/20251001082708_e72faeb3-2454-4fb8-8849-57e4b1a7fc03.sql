-- Add new columns to companies table
ALTER TABLE public.companies
ADD COLUMN description text,
ADD COLUMN contact_person text NOT NULL DEFAULT '',
ADD COLUMN contact_email text NOT NULL DEFAULT '',
ADD COLUMN contact_phone text NOT NULL DEFAULT '';

-- Remove default values after adding columns (we want them required for new entries)
ALTER TABLE public.companies
ALTER COLUMN contact_person DROP DEFAULT,
ALTER COLUMN contact_email DROP DEFAULT,
ALTER COLUMN contact_phone DROP DEFAULT;