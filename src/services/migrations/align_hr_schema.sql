-- ALIGN EMPLOYEES SCHEMA
-- This script renames 'company_id' to 'organization_id' in the 'employees' table
-- to match the 'profiles' table and the rest of the application schema.

-- 1. Rename Column (Safe operation, preserves data)
ALTER TABLE employees RENAME COLUMN company_id TO organization_id;

-- 2. Update RLS Policy
DROP POLICY IF EXISTS "Tenant isolation for employees" ON employees;

CREATE POLICY "Tenant isolation for employees" ON employees 
FOR ALL 
USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- 3. Verify
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'employees' AND column_name = 'organization_id';
