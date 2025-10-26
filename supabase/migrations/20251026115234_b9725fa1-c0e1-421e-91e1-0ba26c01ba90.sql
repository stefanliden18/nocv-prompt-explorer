-- Rensa alla falska municipality concept_ids som genererades av fallback-logik
DELETE FROM af_taxonomy 
WHERE type = 'municipality' 
AND concept_id LIKE 'mun_%';