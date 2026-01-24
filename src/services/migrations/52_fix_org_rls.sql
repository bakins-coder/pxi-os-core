-- MIGRATION: 52 Fix Organizations RLS
-- Purpose: Ensure Super Admins can see ALL organizations, and users can see their own.

BEGIN;

-- 1. Enable RLS on organizations (if not already)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive reading policies if they exist (clean slate for read)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.organizations;
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
DROP POLICY IF EXISTS "Super Admins can view all" ON public.organizations;

-- 3. Policy: Super Admins can see EVERYTHING
CREATE POLICY "Super Admins can view all" ON public.organizations
FOR SELECT
TO authenticated
USING (
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- 4. Policy: Users can see the organization they belong to
CREATE POLICY "Users can view own organization" ON public.organizations
FOR SELECT
TO authenticated
USING (
    id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- 5. Policy: Organizations might be public? 
-- If we want login screen to verify org existence, we might need a broader policy or a function.
-- For now, let's keep it secure.

COMMIT;
