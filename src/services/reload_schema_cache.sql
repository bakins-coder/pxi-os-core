-- RELOAD SCHEMA CACHE
-- Run this in the Supabase Dashboard SQL Editor to make the API aware of new tables (like 'inventory').

NOTIFY pgrst, 'reload schema';
