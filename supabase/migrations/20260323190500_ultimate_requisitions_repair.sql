-- Migration: Ultimate Requisitions Schema Repair
-- Description: Ensures ALL columns required by the app for the 'requisitions' table are present.
-- This fixes the "Could not find column ... in the schema cache" error.

-- 1. Add all potentially missing columns
ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS requestor_name TEXT;
ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS source_account_id UUID;
ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS pack_count INTEGER;
ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS pack_size NUMERIC;
ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS pack_type TEXT;

-- 2. Ensure types are correct (Postgres handles ADD COLUMN IF NOT EXISTS gracefully if types match)

-- 3. Reload Schema Cache (Critical for PostgREST/Supabase to see new columns immediately)
NOTIFY pgrst, 'reload config';

-- 4. Verify/Fix RLS (Ensuring the policy uses organization_id or company_id consistently)
-- Check if policy exists, if not create a default one.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'requisitions' AND policyname = 'requisitions_manage_ultimate'
    ) THEN
        DROP POLICY IF EXISTS "requisitions_manage_20260224" ON public.requisitions;
        CREATE POLICY "requisitions_manage_ultimate" ON public.requisitions 
        FOR ALL USING (company_id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid));
    END IF;
END
$$;
