
-- Migration: Safe Requisitions RLS Repair
-- Description: Fixes the dangerous UUID cast that potentially causes PostgREST crashes (TypeError: Failed to fetch)
-- when users have legacy 'org-xquisite' IDs in their JWT metadata.

-- 1. Create a helper function for safe UUID casting if it doesn't exist
CREATE OR REPLACE FUNCTION public.safe_uuid(text_id text) 
RETURNS uuid AS $$
BEGIN
  RETURN text_id::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Update the requisitions policy to use safe casting
DO $$
BEGIN
    -- Drop both old policies to be sure
    DROP POLICY IF EXISTS "requisitions_manage_20260224" ON public.requisitions;
    DROP POLICY IF EXISTS "requisitions_manage_ultimate" ON public.requisitions;
    
    -- Create the safest possible policy
    -- This handles cases where:
    -- a) company_id is NULL
    -- b) JWT metadata has a non-uuid string (e.g. 'org-xquisite')
    CREATE POLICY "requisitions_manage_safe_v1" ON public.requisitions 
    FOR ALL USING (
        company_id = public.safe_uuid(auth.jwt() -> 'user_metadata' ->> 'company_id')
        OR
        company_id = public.safe_uuid(auth.jwt() -> 'user_metadata' ->> 'organization_id')
    );
END
$$;

-- 3. Reload cache
NOTIFY pgrst, 'reload config';
