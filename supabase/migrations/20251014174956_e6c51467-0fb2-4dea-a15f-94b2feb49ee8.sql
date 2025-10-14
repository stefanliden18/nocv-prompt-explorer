-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule interview reminder job to run every hour
SELECT cron.schedule(
  'send-interview-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://awtxvhstozhprjujlsne.supabase.co/functions/v1/send-interview-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    )
  ) as request_id;
  $$
);