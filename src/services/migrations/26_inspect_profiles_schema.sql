-- DIAGNOSTIC: Inspect Profiles Schema
-- Purpose: List all columns in the public.profiles table to debug missing column errors.

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;
