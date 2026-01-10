-- SCHEMA REPAIR SCRIPT
-- This script fixes existing tables that are missing the 'company_id' column
-- which is required for Security/Multi-tenancy.

-- 1. Fix 'catering_events'
ALTER TABLE catering_events 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES organizations(id);

-- 2. Fix 'tasks' (just in case)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES organizations(id);

-- 3. Fix 'projects' (just in case)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES organizations(id);

-- 4. Fix 'requisitions' (just in case)
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES organizations(id);

-- 5. Fix 'users' (critical for login)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES organizations(id);

-- 6. NOW apply the Security Policy for catering_events
ALTER TABLE catering_events ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Tenant isolation for catering_events" ON catering_events;
    CREATE POLICY "Tenant isolation for catering_events" ON catering_events 
    FOR ALL USING (company_id = (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid);
EXCEPTION 
    WHEN undefined_column THEN 
        RAISE NOTICE 'Skipping policy creation - column likely still missing if alter failed';
END $$;
