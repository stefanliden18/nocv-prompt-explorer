-- Add address fields to companies table
ALTER TABLE companies 
ADD COLUMN address TEXT,
ADD COLUMN postal_code TEXT,
ADD COLUMN city TEXT;

-- Add wage type code to jobs table with default value
ALTER TABLE jobs
ADD COLUMN af_wage_type_code TEXT DEFAULT 'oG8G_9cW_nRf';