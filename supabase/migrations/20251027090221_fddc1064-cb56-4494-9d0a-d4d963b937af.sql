-- Lägg till legacy_id kolumn för gamla AF SSYK-baserade ID:n
ALTER TABLE af_taxonomy 
ADD COLUMN IF NOT EXISTS legacy_id TEXT;

-- Skapa index för snabbare lookups
CREATE INDEX IF NOT EXISTS idx_af_taxonomy_legacy_id ON af_taxonomy(legacy_id);

-- Kommentar för klarhet
COMMENT ON COLUMN af_taxonomy.legacy_id IS 'Gamla AF SSYK-baserade ID:n (deprecated_legacy_id från Taxonomy API) som Partner API förväntar sig';
