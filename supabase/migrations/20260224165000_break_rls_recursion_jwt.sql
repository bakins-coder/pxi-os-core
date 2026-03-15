-- MIGRATION: Break RLS Recursion using JWT Metadata
-- Description: Switches policies to use JWT metadata for organization identity, bypassing table-lookup recursion.

BEGIN;

-- 1. Create a helper function that ONLY uses JWT metadata
-- This avoids querying any tables (like profiles) thus preventing recursion.
CREATE OR REPLACE FUNCTION public.get_jwt_organization_id()
RETURNS uuid AS $$
BEGIN
  -- We use the organization_id from the user's JWT metadata
  -- This is set during login/onboarding and is the source of truth for RLS
  RETURN (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid;
EXCEPTION WHEN OTHERS THEN
  -- Fallback to the old key name if necessary, or return null
  RETURN (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;


-- 2. Profiles Table: Safe Policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profile isolation" ON public.profiles;

-- Users can see their own profile and profiles in the same organization (via JWT)
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR
    organization_id = get_jwt_organization_id()
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());


-- 3. Catering Events: Non-recursive Policy
ALTER TABLE public.catering_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their organization events" ON public.catering_events;
DROP POLICY IF EXISTS "Enable access for organization members" ON public.catering_events;

CREATE POLICY "Users can manage their organization events"
ON public.catering_events FOR ALL
TO authenticated
USING (
    organization_id = get_jwt_organization_id() OR
    company_id = get_jwt_organization_id()
)
WITH CHECK (
    organization_id = get_jwt_organization_id() OR
    company_id = get_jwt_organization_id()
);


-- 4. Invoices: Non-recursive Policy
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their organization invoices" ON public.invoices;

CREATE POLICY "Users can manage their organization invoices"
ON public.invoices FOR ALL
TO authenticated
USING (
    company_id = get_jwt_organization_id()
)
WITH CHECK (
    company_id = get_jwt_organization_id()
);


-- 5. Organizations: General Access
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.organizations;

CREATE POLICY "Enable read access for authenticated users"
ON public.organizations FOR SELECT
TO authenticated
USING (true);

COMMIT;
