-- Fix is_default: Only the first pipeline stage should be default
UPDATE pipeline_stages SET is_default = false;
UPDATE pipeline_stages SET is_default = true 
WHERE display_order = 1;