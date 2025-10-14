-- Add interview management columns to applications table
ALTER TABLE applications
ADD COLUMN interview_scheduled_at TIMESTAMPTZ,
ADD COLUMN interview_link TEXT,
ADD COLUMN interview_notes TEXT,
ADD COLUMN reminder_sent BOOLEAN DEFAULT false;