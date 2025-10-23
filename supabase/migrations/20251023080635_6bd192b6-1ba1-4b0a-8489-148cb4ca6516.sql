-- Add organization number to companies table
ALTER TABLE companies 
ADD COLUMN org_number TEXT;