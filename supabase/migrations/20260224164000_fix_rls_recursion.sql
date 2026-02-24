-- MIGRATION: Fix RLS Recursion and Standardize Multi-tenancy
-- Description: Uses a security-definer function to break circular dependencies in the profiles table.

BEGIN;

-- 1. Create a helper function to get the current user's organization_id
-- This function is SECURITY DEFINER, meaning it runs with the privileges of the creator (bypass RLS)
-- This is the standard way to break recursion in Supabase.
CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. Profiles Table: Fix Recursion
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profile isolation" ON public.profiles;

CREATE POLICY "Users can view profiles in their organization"
ON public.profiles FOR SELECT
TO authenticated
USING (
    organization_id = get_my_organization_id()
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());


-- 3. Catering Events: Robust Policy
ALTER TABLE public.catering_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their organization events" ON public.catering_events;
DROP POLICY IF EXISTS "Users can insert their organization events" ON public.catering_events;
DROP POLICY IF EXISTS "Users can update their organization events" ON public.catering_events;
DROP POLICY IF EXISTS "Users can delete their organization events" ON public.catering_events;

CREATE POLICY "Users can manage their organization events"
ON public.catering_events FOR ALL
TO authenticated
USING (
    organization_id = get_my_organization_id() OR
    company_id = get_my_organization_id()
)
WITH CHECK (
    organization_id = get_my_organization_id() OR
    company_id = get_my_organization_id()
);


-- 4. Invoices: Robust Policy
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their organization invoices" ON public.invoices;

CREATE POLICY "Users can manage their organization invoices"
ON public.invoices FOR ALL
TO authenticated
USING (
    company_id = get_my_organization_id()
)
WITH CHECK (
    company_id = get_my_organization_id()
);


-- 5. Organizations: Ensure authenticated users can read names (to avoid empty state fallback)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.organizations;

CREATE POLICY "Enable read access for authenticated users"
ON public.organizations FOR SELECT
TO authenticated
USING (true);

COMMIT;
