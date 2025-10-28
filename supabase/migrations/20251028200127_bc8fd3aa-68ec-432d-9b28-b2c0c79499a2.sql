-- Add is_common column to af_taxonomy
ALTER TABLE af_taxonomy 
ADD COLUMN IF NOT EXISTS is_common BOOLEAN DEFAULT FALSE;

-- Create index for better performance on common items
CREATE INDEX IF NOT EXISTS idx_af_taxonomy_is_common 
ON af_taxonomy(is_common) 
WHERE is_common = TRUE;

-- Mark common occupations (top 50 mest använda yrken i Sverige)
UPDATE af_taxonomy 
SET is_common = TRUE 
WHERE type = 'occupation-name' 
AND label IN (
  'Butikssäljare, fackhandel',
  'Butikssäljare/Medarbetare, dagligvaror',
  'Företagssäljare',
  'Säljare, övrig',
  'Lagerarbetare',
  'Lagermedarbetare',
  'Truckförare',
  'Lastbilschaufför, distributionschaufför',
  'Lastbilschaufför, fjärrtransporter',
  'Vårdbiträde',
  'Undersköterska, hemtjänst',
  'Undersköterska, vård- och omsorgsboende',
  'Undersköterska, sjukhus',
  'Barnskötare',
  'Förskollärare',
  'Lärare i grundskolan, årskurs 4-6',
  'Lärare i grundskolan, årskurs 7-9',
  'Lärare i gymnasieskolan',
  'Fritidspedagog',
  'Receptionist',
  'Kontorsassistent',
  'Kundtjänstmedarbetare',
  'Redovisningsekonom',
  'Redovisningsassistent',
  'Controller',
  'Ekonomiassistent',
  'Projektledare, IT',
  'Projektledare, bygg',
  'Projektledare, marknadsföring',
  'Systemutvecklare/Programmerare',
  'Mjukvaruutvecklare',
  'Webbutvecklare',
  'IT-support/Helpdesk',
  'IT-tekniker',
  'Servicetekniker, elektronik',
  'Servicetekniker, fordon',
  'Kock',
  'Restaurangbiträde',
  'Serveringspersonal',
  'Snickare',
  'Elektriker',
  'VVS-montör',
  'Målare',
  'Byggnadsarbetare',
  'Maskinoperatör, metallarbete',
  'Maskinoperatör, livsmedelsindustri',
  'Produktionstekniker',
  'HR-specialist',
  'Rekryterare'
);