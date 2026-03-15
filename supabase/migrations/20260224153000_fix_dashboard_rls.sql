-- MIGRATION: Fix Dashboard RLS Policies
-- Description: Establishes robust Row Level Security for profiles, catering_events, and organizations.
-- This ensures that authenticated users can see their data and that dashboard components can resolve names/links across tables.

BEGIN;

-- 1. Organizations (Required for basic context)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON organizations;
CREATE POLICY "Enable read access for authenticated users" ON organizations
FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles in their organization" ON profiles;
CREATE POLICY "Users can view all profiles in their organization" ON profiles
FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR organization_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
);

-- 3. Catering Events
ALTER TABLE catering_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable access for organization members" ON catering_events;
CREATE POLICY "Enable access for organization members" ON catering_events
FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR organization_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
    OR company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
) WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR organization_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
    OR company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
);

-- 4. Invoices (Ensure robust policy matching catering_events)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Users can view their own company invoices" ON invoices; -- Drop potential old names
CREATE POLICY "Users can view their own company invoices" ON invoices
FOR ALL USING (
    company_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
) WITH CHECK (
    company_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
);

COMMIT;
