-- DIAGNOSTIC: Check RLS Policies on Profiles
-- Purpose: Verify if the user is allowed to SELECT their own profile data.

SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';
