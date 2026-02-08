-- Add new columns for candidate presentation 2.0
ALTER TABLE candidate_presentations 
ADD COLUMN IF NOT EXISTS recruiter_notes TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS soft_values_notes TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS skill_scores JSONB DEFAULT '{}'::jsonb;