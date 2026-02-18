
ALTER TABLE portal_candidates ADD COLUMN email text;
ALTER TABLE portal_interviews ADD COLUMN email_sent boolean DEFAULT false;
