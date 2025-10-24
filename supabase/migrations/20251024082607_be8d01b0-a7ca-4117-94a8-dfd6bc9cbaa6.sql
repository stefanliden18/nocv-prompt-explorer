-- ✅ Rensa felaktiga kombinationer av anställningstyp och varaktighet
-- 
-- Problem: "Vanlig anställning" är redan tillsvidareanställning enligt AF API.
-- Det är FÖRBJUDET att skicka duration för denna typ.

-- 1. Uppdatera befintliga jobb: Ta bort duration för "Vanlig anställning"
UPDATE jobs 
SET af_duration_code = NULL 
WHERE af_employment_type_code = 'PFZr_Syz_cUq' 
  AND af_duration_code IS NOT NULL;

-- 2. Lägg till kommentar i duration_codes för att förhindra framtida missförstånd
COMMENT ON TABLE af_duration_codes IS 'Varaktighet används endast för tidsbegränsade anställningar. "Vanlig anställning" ska INTE ha duration eftersom den redan är tillsvidare.';
