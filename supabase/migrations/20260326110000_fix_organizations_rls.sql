
-- FIX: Organizations and Profiles RLS for New Signups
-- This script enables authenticated users to create their own organizations and link their profiles.

BEGIN;

-- 1. ORGANIZATIONS: Allow creation and management by creator
-- Drop existing select policy to re-standardize
DROP POLICY IF EXISTS "organizations_select_20260224" ON public.organizations;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.organizations;

-- SELECT: All authenticated users can see names (for setup/lookup)
CREATE POLICY "organizations_select_20260326" ON public.organizations 
FOR SELECT TO authenticated 
USING (true);

-- INSERT: Authenticated users can create new organizations
CREATE POLICY "organizations_insert_20260326" ON public.organizations 
FOR INSERT TO authenticated 
WITH CHECK (true);

-- UPDATE: Only the creator can update the organization settings
CREATE POLICY "organizations_update_20260326" ON public.organizations 
FOR UPDATE TO authenticated 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());


-- 2. PROFILES: Ensure users can link themselves during setup
-- The nuclear fix already has a SELECT policy, we add INSERT/UPDATE
DROP POLICY IF EXISTS "profiles_insert_20260326" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_20260326" ON public.profiles;

CREATE POLICY "profiles_insert_20260326" ON public.profiles 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_20260326" ON public.profiles 
FOR UPDATE TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. USERS (View or Table Backup): 
-- If 'users' is a table, ensure it has similar policies. 
-- In this project, it seems profiles is the main one, but we'll be safe.
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "users_manage_self" ON public.users;
        CREATE POLICY "users_manage_self" ON public.users FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
    END IF;
END $$;

COMMIT;

-- Reload PostgREST to apply changes
NOTIFY pgrst, 'reload config';
