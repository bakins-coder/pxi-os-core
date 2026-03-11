-- MIGRATION: Fix Ingredients RLS
-- Description: Standardizes ingredients table to use the JWT-based security model.

BEGIN;

-- 1. Ensure RLS is enabled
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

-- 2. Drop old policies
DROP POLICY IF EXISTS "Enable access for organization members" ON public.ingredients;
DROP POLICY IF EXISTS "Tenant isolation" ON public.ingredients;

-- 3. Create clean, non-recursive policy using JWT helper
-- The get_jwt_organization_id() function was created in migration 20260224170000_nuclear_rls_fix.sql
CREATE POLICY "ingredients_manage_20260311" ON public.ingredients 
FOR ALL TO authenticated 
USING (organization_id = get_jwt_organization_id())
WITH CHECK (organization_id = get_jwt_organization_id());

-- 4. Grant permissions
GRANT ALL ON public.ingredients TO authenticated;

COMMIT;
