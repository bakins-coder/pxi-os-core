-- FORCE SCHEMA CACHE RELOAD
-- Sometimes Supabase API (PostgREST) holds onto old schema definitions.
-- Running this forces it to refresh.

NOTIFY pgrst, 'reload config';

SELECT 'Schema Cache Reloaded' as status;
