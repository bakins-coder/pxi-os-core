-- Enable the net and cron extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cron job to run daily at 8:00 AM UTC
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'invoice-notifications') THEN
        PERFORM cron.unschedule('invoice-notifications');
    END IF;
END $$;

SELECT cron.schedule(
  'invoice-notifications',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://' || current_setting('request.headers')::jsonb->>'host' || '/functions/v1/invoice-overdue-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claims')::jsonb->>'role'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
