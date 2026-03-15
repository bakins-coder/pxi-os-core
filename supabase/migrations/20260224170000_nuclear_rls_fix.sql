-- FINAL PERMANENT FIX: Nuclear RLS Clean-up and JWT Standardization
-- This script clears all existing policies and implements a zero-recursion JWT-based security model.

BEGIN;

-- 1. DYNAMICALLY DROP ALL POLICIES on core tables to ensure a clean slate
-- This removes any hidden or conflicting policies from previous migrations.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'catering_events', 'organizations', 'invoices', 'contacts')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;


-- 2. RE-ENABLE RLS on all relevant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;


-- 3. CREATE STABLE JWT HELPER (Zero table lookups = Zero recursion)
-- This function extracts the organization identity directly from the user's encrypted session token.
CREATE OR REPLACE FUNCTION public.get_jwt_organization_id()
RETURNS uuid AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid,
    (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid,
    (auth.jwt() -> 'user_metadata' ->> 'org_id')::uuid,
    (auth.jwt() -> 'user_metadata' ->> 'companyId')::uuid
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;


-- 4. APPLY CLEAN, NON-RECURSIVE POLICIES

-- PROFILES: Users can see themselves and anyone in their organization
-- profiles table uses 'organization_id'
CREATE POLICY "profiles_select_20260224" ON public.profiles 
FOR SELECT TO authenticated 
USING (id = auth.uid() OR organization_id = get_jwt_organization_id());

CREATE POLICY "profiles_update_20260224" ON public.profiles 
FOR UPDATE TO authenticated 
USING (id = auth.uid());

-- CATERING EVENTS: Fully isolated by Organization ID/Company ID
-- catering_events table has both columns
CREATE POLICY "events_manage_20260224" ON public.catering_events 
FOR ALL TO authenticated 
USING (organization_id = get_jwt_organization_id() OR company_id = get_jwt_organization_id())
WITH CHECK (organization_id = get_jwt_organization_id() OR company_id = get_jwt_organization_id());

-- INVOICES: Fully isolated by Company ID
-- invoices table uses 'company_id'
CREATE POLICY "invoices_manage_20260224" ON public.invoices 
FOR ALL TO authenticated 
USING (company_id = get_jwt_organization_id())
WITH CHECK (company_id = get_jwt_organization_id());

-- CONTACTS: Accessible to organization members
-- contacts table uses 'company_id'
CREATE POLICY "contacts_manage_20260224" ON public.contacts 
FOR ALL TO authenticated 
USING (company_id = get_jwt_organization_id())
WITH CHECK (company_id = get_jwt_organization_id());

-- ORGANIZATIONS: Allow authenticated users to read names and settings
CREATE POLICY "organizations_select_20260224" ON public.organizations 
FOR SELECT TO authenticated 
USING (true);

COMMIT;
