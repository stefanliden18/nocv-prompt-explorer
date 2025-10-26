-- Rensa gamla fallback concept_ids för occupation-name och worktime-extent
-- Detta krävs för att få nya riktiga concept_ids från AF:s /main/ endpoint
DELETE FROM af_taxonomy WHERE type IN ('occupation-name', 'worktime-extent');